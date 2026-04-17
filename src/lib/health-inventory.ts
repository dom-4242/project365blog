import { prisma } from '@/lib/db'

export type HealthCategory = 'Aktivität' | 'Körper' | 'Herz & Vitalwerte' | 'Schlaf'

export interface AttributeStats {
  key: string
  displayName: string
  category: HealthCategory
  unit: string
  usedInDashboard: boolean
  dashboardNote?: string
  // from DB
  count: number
  lastValue: number | null
  lastDate: Date | null
}

// Static mapping: DB column → HealthKit display info
// Reflects what parseHealthPayload() actually maps from Apple Health.
// Fields only from Fitbit (bmi, activeMinutes) are intentionally excluded.
const ATTRIBUTES: Array<Omit<AttributeStats, 'count' | 'lastValue' | 'lastDate'> & { dbField: string }> = [
  {
    key: 'steps',
    dbField: 'steps',
    displayName: 'Schritte',
    category: 'Aktivität',
    unit: 'Schritte',
    usedInDashboard: true,
    dashboardNote: 'Ø 30 Tage in Bento-Grid',
  },
  {
    key: 'caloriesBurned',
    dbField: 'caloriesBurned',
    displayName: 'Kalorienverbrauch (Aktiv + Basal)',
    category: 'Aktivität',
    unit: 'kcal',
    usedInDashboard: false,
  },
  {
    key: 'distance',
    dbField: 'distance',
    displayName: 'Lauf-/Gehdistanz',
    category: 'Aktivität',
    unit: 'km',
    usedInDashboard: false,
  },
  {
    key: 'restingHR',
    dbField: 'restingHR',
    displayName: 'Ruheherzfrequenz',
    category: 'Herz & Vitalwerte',
    unit: 'bpm',
    usedInDashboard: false,
  },
  {
    key: 'sleepDuration',
    dbField: 'sleepDuration',
    displayName: 'Schlafdauer',
    category: 'Schlaf',
    unit: 'min',
    usedInDashboard: false,
  },
  {
    key: 'weight',
    dbField: 'weight',
    displayName: 'Körpergewicht',
    category: 'Körper',
    unit: 'kg',
    usedInDashboard: true,
    dashboardNote: 'Startseite – primär via Fitbit Aria',
  },
  {
    key: 'bodyFat',
    dbField: 'bodyFat',
    displayName: 'Körperfettanteil',
    category: 'Körper',
    unit: '%',
    usedInDashboard: true,
    dashboardNote: 'Startseite – primär via Fitbit Aria',
  },
]

// Prisma dynamic field access requires `as any` — field names are validated by the static list above.
async function fetchFieldStats(field: string): Promise<{
  count: number
  lastValue: number | null
  lastDate: Date | null
}> {
  const [count, last] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma.dailyMetrics.count({ where: { [field]: { not: null } } as any }),
    prisma.dailyMetrics.findFirst({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: { [field]: { not: null } } as any,
      orderBy: { date: 'desc' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      select: { [field]: true, date: true } as any,
    }),
  ])
  return {
    count,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lastValue: last ? ((last as any)[field] as number | null) : null,
    lastDate: last ? (last as unknown as { date: Date }).date : null,
  }
}

export async function getHealthInventory(): Promise<AttributeStats[]> {
  const stats = await Promise.all(
    ATTRIBUTES.map(async ({ dbField, ...attr }) => {
      const { count, lastValue, lastDate } = await fetchFieldStats(dbField)
      return { ...attr, count, lastValue, lastDate }
    }),
  )
  return stats
}

export const CATEGORY_ORDER: HealthCategory[] = [
  'Aktivität',
  'Körper',
  'Herz & Vitalwerte',
  'Schlaf',
]
