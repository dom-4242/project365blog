import { prisma } from '@/lib/db'
import { lookupMeta } from '@/lib/health-inventory'
import { WITHINGS_MEASURE_TYPES, WITHINGS_DASHBOARD_TYPES, measureTypeLabel } from '@/lib/withings'

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
]

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
// Registry
// =============================================

const PROVIDERS: Array<() => Promise<InventoryRow[]>> = [
  getAppleHealthInventory,
  getWithingsInventory,
]

/** Runs every source provider and returns the combined inventory. */
export async function getAllInventory(): Promise<InventoryRow[]> {
  const results = await Promise.all(PROVIDERS.map((p) => p()))
  return results.flat()
}
