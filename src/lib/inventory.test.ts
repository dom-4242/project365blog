import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    healthMetricInventory: { findMany: vi.fn() },
    withingsMeasurement: { groupBy: vi.fn() },
    nutritionLog: { findMany: vi.fn() },
    $queryRaw: vi.fn(),
  },
}))

vi.mock('@/lib/db', () => ({ prisma: mockPrisma }))

import {
  getAppleHealthInventory,
  getWithingsInventory,
  getMyFitnessPalInventory,
  getAllInventory,
} from './inventory'

beforeEach(() => {
  vi.clearAllMocks()
  // Safe defaults so providers not under test contribute nothing.
  mockPrisma.healthMetricInventory.findMany.mockResolvedValue([])
  mockPrisma.withingsMeasurement.groupBy.mockResolvedValue([])
  mockPrisma.nutritionLog.findMany.mockResolvedValue([])
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
// MyFitnessPal provider
// =============================================

describe('getMyFitnessPalInventory', () => {
  it('aggregates daily totals per nutrient (macros + micros)', async () => {
    mockPrisma.nutritionLog.findMany.mockResolvedValue([
      // day 1: two meals
      { date: new Date('2026-07-01'), createdAt: new Date('2026-07-01'), calories: 450, protein: 25, carbs: 40, fat: 20, fiber: 6, sugar: 10, sodium: 300, micros: { satFat: 5 } },
      { date: new Date('2026-07-01'), createdAt: new Date('2026-07-01'), calories: 700, protein: 40, carbs: 60, fat: 30, fiber: 8, sugar: 12, sodium: 600, micros: { satFat: 8 } },
      // day 2: one meal
      { date: new Date('2026-07-02'), createdAt: new Date('2026-07-02'), calories: 400, protein: 30, carbs: null, fat: null, fiber: null, sugar: null, sodium: null, micros: {} },
    ])

    const rows = await getMyFitnessPalInventory()
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r]))

    // calories present on both days → count 2, last day's total = 400
    expect(byKey['calories'].sampleCount).toBe(2)
    expect(byKey['calories'].lastValue).toBe(400)
    expect(byKey['calories'].lastValueDate).toBe('2026-07-02')
    expect(byKey['calories'].displayName).toBe('Kalorien')
    expect(byKey['calories'].unit).toBe('kcal')
    expect(byKey['calories'].source).toBe('MYFITNESSPAL')
    expect(byKey['calories'].status).toBe('STORED')

    // micro summed across meals of day 1 → satFat total 13 on 2026-07-01
    expect(byKey['satFat'].lastValueDate).toBe('2026-07-01')
    expect(byKey['satFat'].lastValue).toBe(13)

    // carbs only present on day 1 (day 2 null) → count 1
    expect(byKey['carbs'].sampleCount).toBe(1)
  })

  it('returns empty array when no nutrition logs exist', async () => {
    mockPrisma.nutritionLog.findMany.mockResolvedValue([])
    expect(await getMyFitnessPalInventory()).toEqual([])
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
    mockPrisma.nutritionLog.findMany.mockResolvedValue([
      { date: new Date('2026-07-01'), createdAt: new Date('2026-07-01'), calories: 450, protein: 25, carbs: null, fat: null, fiber: null, sugar: null, sodium: null, micros: {} },
    ])

    const rows = await getAllInventory()
    const sources = new Set(rows.map((r) => r.source))
    expect(sources).toEqual(new Set(['APPLE_HEALTH', 'WITHINGS', 'MYFITNESSPAL']))
  })
})
