import { MetricSource, type DailyMetrics } from '@prisma/client'

// =============================================
// Types — Health Auto Export payload
// =============================================

interface HealthMetricEntry {
  qty?: number
  min?: number
  avg?: number
  max?: number
  date: string // "yyyy-MM-dd HH:mm:ss Z"
  // Sleep aggregated fields (unit: hr)
  asleep?: number
  inBed?: number
  deep?: number
  rem?: number
  core?: number
}

interface HealthMetric {
  name: string
  units: string
  data: HealthMetricEntry[]
}

export interface HealthPayload {
  data: {
    metrics?: HealthMetric[]
    workouts?: unknown[]
  }
}

export interface DayHealthData {
  weight?: number
  bodyFat?: number
  steps?: number
  caloriesBurned?: number
  distance?: number
  restingHR?: number
  sleepDuration?: number // minutes
}

// =============================================
// Helpers
// =============================================

function extractDate(dateStr: string): string {
  // "2026-03-28 23:45:00 +0100" → "2026-03-28"
  return dateStr.slice(0, 10)
}

function findMetric(metrics: HealthMetric[], ...names: string[]): HealthMetric | undefined {
  // Normalize: lowercase + underscores → spaces to match both "step count" and "step_count"
  const normalize = (s: string) => s.toLowerCase().replace(/_/g, ' ')
  const normalizedNames = names.map(normalize)
  return metrics.find((m) => normalizedNames.includes(normalize(m.name)))
}

function sumByDate(metric: HealthMetric): Map<string, number> {
  const result = new Map<string, number>()
  for (const entry of metric.data) {
    const date = extractDate(entry.date)
    result.set(date, (result.get(date) ?? 0) + (entry.qty ?? 0))
  }
  return result
}

function avgByDate(metric: HealthMetric): Map<string, number> {
  const totals = new Map<string, { sum: number; count: number }>()
  for (const entry of metric.data) {
    const date = extractDate(entry.date)
    const value = entry.avg ?? entry.qty ?? 0
    const current = totals.get(date) ?? { sum: 0, count: 0 }
    totals.set(date, { sum: current.sum + value, count: current.count + 1 })
  }
  const result = new Map<string, number>()
  for (const [date, { sum, count }] of totals) {
    result.set(date, Math.round(sum / count))
  }
  return result
}

function lastByDate(metric: HealthMetric): Map<string, number> {
  const result = new Map<string, number>()
  for (const entry of metric.data) {
    const date = extractDate(entry.date)
    if (entry.qty !== undefined) result.set(date, entry.qty)
  }
  return result
}

function sleepMinutesByDate(metric: HealthMetric): Map<string, number> {
  const isHours = metric.units.toLowerCase().startsWith('h')
  const result = new Map<string, number>()
  for (const entry of metric.data) {
    const date = extractDate(entry.date)
    // Prefer aggregated `asleep` field, fall back to `qty`
    const raw = entry.asleep ?? entry.qty ?? 0
    const minutes = isHours ? Math.round(raw * 60) : Math.round(raw)
    result.set(date, (result.get(date) ?? 0) + minutes)
  }
  return result
}

// =============================================
// Parser
// =============================================

export function parseHealthPayload(payload: HealthPayload): Map<string, DayHealthData> {
  const metrics = payload.data.metrics ?? []
  const result = new Map<string, DayHealthData>()

  function getOrCreate(date: string): DayHealthData {
    if (!result.has(date)) result.set(date, {})
    return result.get(date)!
  }

  // Steps
  const stepMetric = findMetric(metrics, 'step count', 'steps')
  if (stepMetric) {
    for (const [date, steps] of sumByDate(stepMetric)) {
      getOrCreate(date).steps = Math.round(steps)
    }
  }

  // Resting Heart Rate
  const hrMetric = findMetric(metrics, 'resting heart rate')
  if (hrMetric) {
    for (const [date, hr] of avgByDate(hrMetric)) {
      getOrCreate(date).restingHR = hr
    }
  }

  // Calories: Active Energy + Basal Energy = total burned
  const activeEnergyMetric = findMetric(metrics, 'active energy', 'active energy burned')
  const basalEnergyMetric = findMetric(metrics, 'basal energy burned', 'resting energy')
  if (activeEnergyMetric) {
    const activeByDate = sumByDate(activeEnergyMetric)
    const basalByDate = basalEnergyMetric ? sumByDate(basalEnergyMetric) : new Map<string, number>()
    const allDates = new Set([...activeByDate.keys(), ...basalByDate.keys()])
    for (const date of allDates) {
      const total = Math.round((activeByDate.get(date) ?? 0) + (basalByDate.get(date) ?? 0))
      if (total > 0) getOrCreate(date).caloriesBurned = total
    }
  }

  // Distance — convert miles to km if needed
  const distanceMetric = findMetric(metrics, 'walking + running distance', 'walking running distance', 'distance walking running')
  if (distanceMetric) {
    const isMiles = distanceMetric.units.toLowerCase() === 'mi'
    for (const [date, dist] of sumByDate(distanceMetric)) {
      const km = isMiles ? dist * 1.60934 : dist
      getOrCreate(date).distance = Math.round(km * 100) / 100
    }
  }

  // Sleep
  const sleepMetric = findMetric(metrics, 'sleep analysis', 'sleep')
  if (sleepMetric) {
    for (const [date, minutes] of sleepMinutesByDate(sleepMetric)) {
      if (minutes > 0) getOrCreate(date).sleepDuration = minutes
    }
  }

  // Weight (Fitbit takes priority in merge, but we parse it here)
  const weightMetric = findMetric(metrics, 'body mass', 'weight')
  if (weightMetric) {
    for (const [date, weight] of lastByDate(weightMetric)) {
      getOrCreate(date).weight = Math.round(weight * 10) / 10
    }
  }

  // Body Fat
  const bodyFatMetric = findMetric(metrics, 'body fat percentage', 'body fat')
  if (bodyFatMetric) {
    for (const [date, fat] of lastByDate(bodyFatMetric)) {
      getOrCreate(date).bodyFat = Math.round(fat * 100) / 100
    }
  }

  return result
}

// =============================================
// Merge logic
// =============================================

type MergeableMetrics = Pick<
  DailyMetrics,
  | 'weight'
  | 'bodyFat'
  | 'bmi'
  | 'steps'
  | 'caloriesBurned'
  | 'distance'
  | 'restingHR'
  | 'sleepDuration'
  | 'source'
>

/**
 * Merges Apple Health data into an existing DailyMetrics record.
 *
 * Rules (from CLAUDE.md):
 * - Fitbit primary for weight/bodyFat/bmi (Aria scale)
 * - Apple Watch primary for restingHR and sleep
 * - Steps: higher value wins
 * - Calories/distance: Apple fills gaps, doesn't overwrite Fitbit values
 * - source → MERGED if existing was FITBIT, stays APPLE_HEALTH otherwise
 */
export function mergeWithExisting(
  existing: MergeableMetrics,
  incoming: DayHealthData,
): MergeableMetrics {
  const hadFitbit =
    existing.source === MetricSource.FITBIT || existing.source === MetricSource.MERGED

  return {
    // Weight/BMI: keep Fitbit, only use Apple if no Fitbit data exists
    weight: hadFitbit && existing.weight !== null ? existing.weight : (incoming.weight ?? existing.weight),
    bodyFat: hadFitbit && existing.bodyFat !== null ? existing.bodyFat : (incoming.bodyFat ?? existing.bodyFat),
    bmi: existing.bmi, // BMI is always derived from Fitbit scale

    // Steps: higher value wins
    steps:
      incoming.steps !== undefined && existing.steps !== null
        ? Math.max(incoming.steps, existing.steps)
        : (incoming.steps ?? existing.steps),

    // Resting HR: Apple Watch wins (better sensor for continuous HR)
    restingHR: incoming.restingHR ?? existing.restingHR,

    // Sleep: Apple fills gap, doesn't overwrite existing
    sleepDuration: incoming.sleepDuration ?? existing.sleepDuration,

    // Calories/distance: Apple fills gaps only
    caloriesBurned: existing.caloriesBurned ?? incoming.caloriesBurned ?? null,
    distance: existing.distance ?? incoming.distance ?? null,

    source: hadFitbit ? MetricSource.MERGED : MetricSource.APPLE_HEALTH,
  }
}
