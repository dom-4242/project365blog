import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    withingsMeasurement: { findMany: vi.fn() },
  },
}))

vi.mock('@/lib/db', () => ({ prisma: mockPrisma }))

import {
  computeTrend,
  computeZonePercentages,
  getBodyComposition,
  getSegmentalComposition,
} from './coach'

describe('computeTrend', () => {
  it('returns flat with null delta when there is no previous value', () => {
    const r = computeTrend(42, null)
    expect(r).toEqual({ current: 42, previous: null, delta: null, trend: 'flat' })
  })

  it('detects an upward trend above the epsilon threshold', () => {
    const r = computeTrend(40.5, 39.0)
    expect(r.delta).toBe(1.5)
    expect(r.trend).toBe('up')
  })

  it('detects a downward trend below the epsilon threshold', () => {
    const r = computeTrend(38.2, 40.0)
    expect(r.delta).toBe(-1.8)
    expect(r.trend).toBe('down')
  })

  it('treats sub-epsilon changes as flat', () => {
    const r = computeTrend(40.02, 40.0)
    expect(r.trend).toBe('flat')
  })

  it('rounds the delta to one decimal place', () => {
    const r = computeTrend(40.06, 40.0)
    expect(r.delta).toBe(0.1)
    expect(r.trend).toBe('up')
  })

  it('respects a custom epsilon', () => {
    expect(computeTrend(40.3, 40.0, 0.5).trend).toBe('flat')
    expect(computeTrend(40.7, 40.0, 0.5).trend).toBe('up')
  })
})

describe('getBodyComposition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Rows keyed by Withings meastype. Whole-body values (e.g. muscle 76) arrive with
  // a segmental position code, so the query must NOT filter on position 0.
  const dataByType: Record<number, Array<{ date: Date; value: number }>> = {
    76: [
      { date: new Date('2026-07-14T12:00:00Z'), value: 67.3 },
      { date: new Date('2026-07-07T12:00:00Z'), value: 66.8 },
    ],
    8: [
      { date: new Date('2026-07-14T12:00:00Z'), value: 25.1 },
      { date: new Date('2026-07-07T12:00:00Z'), value: 25.6 },
    ],
    170: [{ date: new Date('2026-07-14T12:00:00Z'), value: 4.6 }],
  }

  function wireMock() {
    mockPrisma.withingsMeasurement.findMany.mockImplementation(
      (args: { where: { type: number } }) =>
        Promise.resolve(dataByType[args.where.type] ?? []),
    )
  }

  it('returns every configured composition metric that has data, in order', async () => {
    wireMock()
    const result = await getBodyComposition()
    // 77/88/226/227 have no rows → omitted; order follows COMPOSITION_TYPES.
    expect(result.metrics.map((m) => m.key)).toEqual(['muscleMass', 'fatMass', 'visceralFat'])
  })

  it('computes value/delta/trend from the latest two measurement days', async () => {
    wireMock()
    const { metrics } = await getBodyComposition()
    const muscle = metrics.find((m) => m.key === 'muscleMass')!
    expect(muscle.value).toBe(67.3)
    expect(muscle.delta).toBe(0.5)
    expect(muscle.trend).toBe('up')
    const fat = metrics.find((m) => m.key === 'fatMass')!
    expect(fat.delta).toBe(-0.5)
    expect(fat.trend).toBe('down')
    const visceral = metrics.find((m) => m.key === 'visceralFat')!
    expect(visceral.value).toBe(4.6)
    expect(visceral.delta).toBeNull()
    expect(visceral.trend).toBe('flat')
  })

  it('does NOT filter on position (regression: whole-body values are not position 0)', async () => {
    wireMock()
    await getBodyComposition()
    for (const call of mockPrisma.withingsMeasurement.findMany.mock.calls) {
      expect(call[0].where).not.toHaveProperty('position')
    }
  })

  it('exposes the most recent measurement date across all metrics', async () => {
    wireMock()
    const result = await getBodyComposition()
    expect(result.latestDate).toBe('2026-07-14')
    expect(result.metrics.every((m) => m.date === '2026-07-14')).toBe(true)
  })

  it('returns no metrics and a null date when Withings has no data', async () => {
    mockPrisma.withingsMeasurement.findMany.mockResolvedValue([])
    const result = await getBodyComposition()
    expect(result.metrics).toEqual([])
    expect(result.latestDate).toBeNull()
  })
})

describe('computeZonePercentages', () => {
  // Torso: 8.0 kg fat + 16.0 kg fat-free (10.5 kg of which muscle).
  //   fat% = 8/24 = 33.3, muscle% = 10.5/24 = 43.8
  // Arms sum left (3) + right (2); legs sum left (10) + right (11).
  const rows = [
    // torso (position 12)
    { type: 174, position: 12, value: 8.0 },
    { type: 173, position: 12, value: 16.0 },
    { type: 175, position: 12, value: 10.5 },
    // right arm (2) + left arm (3) → arms total fat 2.0, fat-free 6.0, muscle 4.4
    { type: 174, position: 2, value: 1.0 },
    { type: 173, position: 2, value: 3.0 },
    { type: 175, position: 2, value: 2.2 },
    { type: 174, position: 3, value: 1.0 },
    { type: 173, position: 3, value: 3.0 },
    { type: 175, position: 3, value: 2.2 },
    // left leg (10) + right leg (11) → legs total fat 4.0, fat-free 16.0, muscle 12.0
    { type: 174, position: 10, value: 2.0 },
    { type: 173, position: 10, value: 8.0 },
    { type: 175, position: 10, value: 6.0 },
    { type: 174, position: 11, value: 2.0 },
    { type: 173, position: 11, value: 8.0 },
    { type: 175, position: 11, value: 6.0 },
  ]

  it('computes fat% and muscle% per zone from summed left/right segments', () => {
    const z = computeZonePercentages(rows)
    expect(z.torso).toEqual({ fatPct: 33.3, musclePct: 43.8 })
    expect(z.arms).toEqual({ fatPct: 25, musclePct: 55 }) // 2/8, 4.4/8
    expect(z.legs).toEqual({ fatPct: 20, musclePct: 60 }) // 4/20, 12/20
  })

  it('returns null for a zone missing fat or fat-free mass', () => {
    const z = computeZonePercentages([{ type: 174, position: 12, value: 8.0 }])
    expect(z.torso).toBeNull()
  })

  it('yields musclePct null when only fat/fat-free are present', () => {
    const z = computeZonePercentages([
      { type: 174, position: 12, value: 8.0 },
      { type: 173, position: 12, value: 16.0 },
    ])
    expect(z.torso).toEqual({ fatPct: 33.3, musclePct: null })
  })
})

describe('getSegmentalComposition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const latest = new Date('2026-07-14T08:00:00Z')
  const prev = new Date('2026-07-07T08:00:00Z')

  // Segmental rows for two scan days + a whole-body visceral fat row (type 170).
  function segRows() {
    return [
      // latest torso
      { type: 174, position: 12, value: 8.0, date: latest, measuredAt: latest },
      { type: 173, position: 12, value: 16.0, date: latest, measuredAt: latest },
      { type: 175, position: 12, value: 10.5, date: latest, measuredAt: latest },
      // previous torso (more fat, less muscle → fat up, muscle down)
      { type: 174, position: 12, value: 9.0, date: prev, measuredAt: prev },
      { type: 173, position: 12, value: 16.0, date: prev, measuredAt: prev },
      { type: 175, position: 12, value: 10.0, date: prev, measuredAt: prev },
    ]
  }

  function wire() {
    mockPrisma.withingsMeasurement.findMany.mockImplementation(
      (args: { where: { type: number | { in: number[] } } }) => {
        const type = args.where.type
        if (typeof type === 'object' && 'in' in type) return Promise.resolve(segRows())
        if (type === 170) return Promise.resolve([{ date: latest, value: 4.6 }])
        return Promise.resolve([])
      },
    )
  }

  it('derives per-zone percentages, trend deltas and visceral fat from the latest scan', async () => {
    wire()
    const r = await getSegmentalComposition()
    expect(r.hasData).toBe(true)
    expect(r.latestDate).toBe('2026-07-14')
    expect(r.zones.torso?.fatPct).toBe(33.3)
    // fat% latest 33.3 vs previous 36.0 → −2.7 pp
    expect(r.zones.torso?.fatDelta).toBe(-2.7)
    expect(r.zones.torso?.muscleDelta).toBe(3.8) // 43.8 − 40.0
    expect(r.zones.arms).toBeNull() // no arm rows in fixture
    expect(r.visceralFat?.value).toBe(4.6)
  })

  it('reports no data when the scale has no segmental measures', async () => {
    mockPrisma.withingsMeasurement.findMany.mockResolvedValue([])
    const r = await getSegmentalComposition()
    expect(r.hasData).toBe(false)
    expect(r.latestDate).toBeNull()
    expect(r.zones).toEqual({ arms: null, torso: null, legs: null })
  })
})
