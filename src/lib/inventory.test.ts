import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    healthMetricInventory: { findMany: vi.fn() },
    withingsMeasurement: { groupBy: vi.fn() },
    $queryRaw: vi.fn(),
  },
}))

vi.mock('@/lib/db', () => ({ prisma: mockPrisma }))

import { getAppleHealthInventory, getWithingsInventory, getAllInventory } from './inventory'

beforeEach(() => {
  vi.clearAllMocks()
})

// =============================================
// Apple Health provider
// =============================================

describe('getAppleHealthInventory', () => {
  it('maps metric meta to status (DASHBOARD / STORED / UNUSED)', async () => {
    mockPrisma.healthMetricInventory.findMany.mockResolvedValue([
      { metricName: 'step_count', unit: 'count', sampleCount: 586, lastValue: 8, lastValueDate: '2026-07-01', lastReceivedAt: new Date('2026-07-01') },
      { metricName: 'active_energy', unit: 'kcal', sampleCount: 919, lastValue: 1.4, lastValueDate: '2026-07-01', lastReceivedAt: new Date('2026-07-01') },
      { metricName: 'physical_effort', unit: 'kcal', sampleCount: 945, lastValue: 2.7, lastValueDate: '2026-07-01', lastReceivedAt: new Date('2026-07-01') },
    ])

    const rows = await getAppleHealthInventory()
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r]))

    expect(byKey['step_count'].status).toBe('DASHBOARD')
    expect(byKey['step_count'].source).toBe('APPLE_HEALTH')
    expect(byKey['active_energy'].status).toBe('STORED') // mapped to caloriesBurned, not on dashboard
    expect(byKey['physical_effort'].status).toBe('UNUSED') // received but not stored
  })
})

// =============================================
// Withings provider
// =============================================

describe('getWithingsInventory', () => {
  it('aggregates per type, resolves last value, and flags dashboard types', async () => {
    const created = new Date('2026-07-01T09:52:00Z')
    mockPrisma.withingsMeasurement.groupBy.mockResolvedValue([
      { type: 1, _count: 3, _max: { date: new Date('2026-07-01'), createdAt: created } },
      { type: 6, _count: 3, _max: { date: new Date('2026-07-01'), createdAt: created } },
      { type: 76, _count: 3, _max: { date: new Date('2026-07-01'), createdAt: created } },
      { type: 175, _count: 5, _max: { date: new Date('2026-07-01'), createdAt: created } },
      { type: 999, _count: 1, _max: { date: new Date('2026-07-01'), createdAt: created } },
    ])
    mockPrisma.$queryRaw.mockResolvedValue([
      { type: 1, value: 96.1 },
      { type: 6, value: 26.6 },
      { type: 76, value: 34.5 },
      { type: 175, value: 44.7 },
      { type: 999, value: 1.2 },
    ])

    const rows = await getWithingsInventory()
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r]))

    // weight = dashboard type
    expect(byKey['1'].status).toBe('DASHBOARD')
    expect(byKey['1'].displayName).toBe('Gewicht')
    expect(byKey['1'].unit).toBe('kg')
    expect(byKey['1'].sampleCount).toBe(3)
    expect(byKey['1'].lastValue).toBe(96.1)
    expect(byKey['1'].lastValueDate).toBe('2026-07-01')

    // body fat = dashboard type
    expect(byKey['6'].status).toBe('DASHBOARD')

    // muscle mass = stored (raw store never "unused")
    expect(byKey['76'].status).toBe('STORED')
    expect(byKey['76'].category).toBe('Körper')

    // segmental type keeps its full count
    expect(byKey['175'].sampleCount).toBe(5)

    // unknown type falls back gracefully
    expect(byKey['999'].displayName).toBe('Typ 999')
    expect(byKey['999'].category).toBe('Sonstiges')
    expect(byKey['999'].status).toBe('STORED')
  })

  it('returns empty array and skips the value query when no measures exist', async () => {
    mockPrisma.withingsMeasurement.groupBy.mockResolvedValue([])
    const rows = await getWithingsInventory()
    expect(rows).toEqual([])
    expect(mockPrisma.$queryRaw).not.toHaveBeenCalled()
  })
})

// =============================================
// Registry
// =============================================

describe('getAllInventory', () => {
  it('combines rows from all providers', async () => {
    mockPrisma.healthMetricInventory.findMany.mockResolvedValue([
      { metricName: 'step_count', unit: 'count', sampleCount: 1, lastValue: 8, lastValueDate: '2026-07-01', lastReceivedAt: new Date('2026-07-01') },
    ])
    mockPrisma.withingsMeasurement.groupBy.mockResolvedValue([
      { type: 1, _count: 1, _max: { date: new Date('2026-07-01'), createdAt: new Date('2026-07-01') } },
    ])
    mockPrisma.$queryRaw.mockResolvedValue([{ type: 1, value: 96.1 }])

    const rows = await getAllInventory()
    const sources = new Set(rows.map((r) => r.source))
    expect(sources).toEqual(new Set(['APPLE_HEALTH', 'WITHINGS']))
    expect(rows).toHaveLength(2)
  })
})
