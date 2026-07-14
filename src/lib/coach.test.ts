import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    withingsMeasurement: { findMany: vi.fn() },
  },
}))

vi.mock('@/lib/db', () => ({ prisma: mockPrisma }))

import { computeTrend, getBodyComposition } from './coach'

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
