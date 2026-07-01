import { prisma } from '@/lib/db'
import { lookupMeta } from '@/lib/health-inventory'
import { WITHINGS_MEASURE_TYPES, WITHINGS_DASHBOARD_TYPES, measureTypeLabel } from '@/lib/withings'
import { NUTRIENT_META, nutrientLabel } from '@/lib/myfitnesspal'

// =============================================
// Generic, source-agnostic health-data inventory
//
// Each data source (Apple Health, Withings, later MyFitnessPal …) contributes
// its metrics as InventoryRow[] via a provider function. The registry
// (getAllInventory) aggregates them. Adding a source = write a provider + list
// it in INVENTORY_SOURCES / the providers array — the admin page adapts itself.
// =============================================

export type InventoryStatus = 'DASHBOARD' | 'STORED' | 'UNUSED'

export interface InventorySource {
  id: string
  label: string
}

export interface InventoryRow {
  source: string                 // source id, e.g. 'APPLE_HEALTH' | 'WITHINGS'
  key: string                    // stable key within the source (metric name | withings type)
  displayName: string
  category: string
  unit: string
  sampleCount: number
  lastValue: number | null
  lastValueDate: string | null   // YYYY-MM-DD
  lastReceivedAt: Date
  status: InventoryStatus
  dashboardNote?: string
}

/** Shared category ordering (superset across all sources). */
export const CATEGORY_ORDER = [
  'Aktivität',
  'Körper',
  'Herz & Vitalwerte',
  'Schlaf',
  'Ernährung',
  'Nerven',
  'Mind & Sonstiges',
  'Sonstiges',
]

export const INVENTORY_SOURCES: InventorySource[] = [
  { id: 'APPLE_HEALTH', label: 'Apple Health' },
  { id: 'WITHINGS', label: 'Withings' },
  { id: 'MYFITNESSPAL', label: 'MyFitnessPal' },
]

const NUTRITION_MACRO_KEYS = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium'] as const

// =============================================
// Provider: Apple Health (HealthMetricInventory table)
// =============================================

export async function getAppleHealthInventory(): Promise<InventoryRow[]> {
  const rows = await prisma.healthMetricInventory.findMany({ orderBy: { metricName: 'asc' } })

  return rows.map((row) => {
    const meta = lookupMeta(row.metricName)
    const status: InventoryStatus = meta.usedInDashboard
      ? 'DASHBOARD'
      : meta.mappedToDb
        ? 'STORED'
        : 'UNUSED'
    return {
      source: 'APPLE_HEALTH',
      key: row.metricName,
      displayName: meta.displayName,
      category: meta.category,
      unit: row.unit,
      sampleCount: row.sampleCount,
      lastValue: row.lastValue,
      lastValueDate: row.lastValueDate,
      lastReceivedAt: row.lastReceivedAt,
      status,
      dashboardNote: meta.dashboardNote,
    }
  })
}

// =============================================
// Provider: Withings (derived from the WithingsMeasurement raw store)
// =============================================

export async function getWithingsInventory(): Promise<InventoryRow[]> {
  // Aggregate per measure type: count + last date + last import time.
  const grouped = await prisma.withingsMeasurement.groupBy({
    by: ['type'],
    _count: true,
    _max: { date: true, createdAt: true },
  })

  if (grouped.length === 0) return []

  // Latest value per type (one query). Segmental types have several positions →
  // DISTINCT ON returns the most recently measured one, which is fine for an overview.
  const latest = await prisma.$queryRaw<Array<{ type: number; value: number }>>`
    SELECT DISTINCT ON (type) type, value
    FROM "WithingsMeasurement"
    ORDER BY type, "measuredAt" DESC
  `
  const latestValueByType = new Map(latest.map((r) => [r.type, r.value]))

  return grouped.map((g) => {
    const meta = WITHINGS_MEASURE_TYPES[g.type]
    const isDashboard = WITHINGS_DASHBOARD_TYPES.has(g.type)
    return {
      source: 'WITHINGS',
      key: String(g.type),
      displayName: meta?.label ?? measureTypeLabel(g.type),
      category: meta?.category ?? 'Sonstiges',
      unit: meta?.unit ?? '',
      sampleCount: g._count,
      lastValue: latestValueByType.get(g.type) ?? null,
      lastValueDate: g._max.date ? g._max.date.toISOString().slice(0, 10) : null,
      lastReceivedAt: g._max.createdAt ?? new Date(0),
      // The raw store keeps every measure, so a Withings metric is never "unused".
      status: isDashboard ? 'DASHBOARD' : 'STORED',
      dashboardNote: isDashboard ? 'Startseite: Gewicht/Körperfett' : undefined,
    }
  })
}

// =============================================
// Provider: MyFitnessPal (derived from the NutritionLog store)
// Aggregates per nutrient over daily totals (sum of meals per day).
// =============================================

export async function getMyFitnessPalInventory(): Promise<InventoryRow[]> {
  const rows = await prisma.nutritionLog.findMany({
    select: {
      date: true, createdAt: true,
      calories: true, protein: true, carbs: true, fat: true, fiber: true, sugar: true, sodium: true,
      micros: true,
    },
  })
  if (rows.length === 0) return []

  // Daily totals per nutrient: date → (nutrientKey → summed value)
  const dailyTotals = new Map<string, Map<string, number>>()
  let lastReceivedAt = new Date(0)

  for (const row of rows) {
    const dateStr = row.date.toISOString().slice(0, 10)
    const day = dailyTotals.get(dateStr) ?? new Map<string, number>()
    if (row.createdAt > lastReceivedAt) lastReceivedAt = row.createdAt

    for (const k of NUTRITION_MACRO_KEYS) {
      const v = row[k]
      if (v != null) day.set(k, (day.get(k) ?? 0) + v)
    }
    if (row.micros && typeof row.micros === 'object' && !Array.isArray(row.micros)) {
      for (const [mk, mv] of Object.entries(row.micros)) {
        if (typeof mv === 'number') day.set(mk, (day.get(mk) ?? 0) + mv)
      }
    }
    dailyTotals.set(dateStr, day)
  }

  // Per nutrient: count of days, last day's total.
  const perNutrient = new Map<string, { count: number; lastDate: string; lastValue: number }>()
  for (const [dateStr, day] of dailyTotals) {
    for (const [key, value] of day) {
      const acc = perNutrient.get(key)
      if (!acc) {
        perNutrient.set(key, { count: 1, lastDate: dateStr, lastValue: value })
      } else {
        acc.count++
        if (dateStr > acc.lastDate) {
          acc.lastDate = dateStr
          acc.lastValue = value
        }
      }
    }
  }

  return [...perNutrient.entries()].map(([key, agg]) => ({
    source: 'MYFITNESSPAL',
    key,
    displayName: nutrientLabel(key),
    category: 'Ernährung',
    unit: NUTRIENT_META[key]?.unit ?? '',
    sampleCount: agg.count,
    lastValue: agg.lastValue,
    lastValueDate: agg.lastDate,
    lastReceivedAt,
    // Raw nutrition store keeps everything; dashboard usage follows in phase 2.
    status: 'STORED' as const,
  }))
}

// =============================================
// Registry
// =============================================

const PROVIDERS: Array<() => Promise<InventoryRow[]>> = [
  getAppleHealthInventory,
  getWithingsInventory,
  getMyFitnessPalInventory,
]

/** Runs every source provider and returns the combined inventory. */
export async function getAllInventory(): Promise<InventoryRow[]> {
  const results = await Promise.all(PROVIDERS.map((p) => p()))
  return results.flat()
}
