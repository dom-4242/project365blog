// =============================================================================
// COACH-DASHBOARD — read-only Datenbeschaffung
//
// Aggregiert bestehende Daten (Nutrition, Withings, Metriken, Journal) für die
// Coach-Landing-Page. ENTHÄLT AUSSCHLIESSLICH LESENDE Operationen — niemals
// Mutationen. Die reinen Rechenhelfer sind exportiert und unit-getestet.
// =============================================================================

import { prisma } from '@/lib/db'
import { MovementLevel, PhaseMode, DeficitMethod } from '@prisma/client'
import { dateOnly } from '@/lib/nutrition/day'
import { zurichDayStart } from '@/lib/timezone'
import { getActivePhase } from '@/lib/nutrition/targets'

export type Trend = 'up' | 'down' | 'flat'

export interface TrendValue {
  current: number
  previous: number | null
  /** current − previous (gerundet auf eine Nachkommastelle), null wenn keine Vormessung. */
  delta: number | null
  trend: Trend
}

/**
 * Reiner Tendenz-Helfer. `eps` ist die Schwelle, ab der eine Änderung als
 * Bewegung (statt "flat") gilt.
 */
export function computeTrend(
  current: number,
  previous: number | null | undefined,
  eps = 0.05,
): TrendValue {
  if (previous == null) {
    return { current, previous: null, delta: null, trend: 'flat' }
  }
  const delta = Math.round((current - previous) * 10) / 10
  const trend: Trend = delta > eps ? 'up' : delta < -eps ? 'down' : 'flat'
  return { current, previous, delta, trend }
}

function toKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// --- Körperzusammensetzung (Withings Muskel-/Fettmasse) ----------------------

export interface BodyCompositionEntry extends TrendValue {
  date: string // Datum der aktuellen Messung
  unit: string
}

/**
 * Withings body-scan composition metrics shown on the coach dashboard, in display
 * order. `key` links a Withings meastype to its i18n label + presentation (unit,
 * good direction) which live in the coach component. See WITHINGS_MEASURE_TYPES.
 */
const COMPOSITION_TYPES: { type: number; key: string }[] = [
  { type: 76, key: 'muscleMass' }, // Muskelmasse (kg)
  { type: 8, key: 'fatMass' }, // Fettmasse (kg)
  { type: 5, key: 'leanMass' }, // Fettfreie Masse (kg)
  { type: 77, key: 'bodyWater' }, // Körperwasser / Hydration (kg)
  { type: 88, key: 'boneMass' }, // Knochenmasse (kg)
  { type: 170, key: 'visceralFat' }, // Viszerales Fett (Index)
  { type: 226, key: 'bmr' }, // Grundumsatz / BMR (kcal)
  { type: 227, key: 'metabolicAge' }, // Stoffwechselalter (Jahre)
]

export interface CompositionMetric {
  /** i18n key suffix; label/unit/goodDirection resolved in the coach component. */
  key: string
  value: number
  delta: number | null
  trend: Trend
  date: string
}

export interface BodyComposition {
  latestDate: string | null
  metrics: CompositionMetric[]
}

async function latestForType(type: number): Promise<Omit<CompositionMetric, 'key'> | null> {
  // Whole-body composite measures carry a single value per measure group. Withings
  // tags that whole-body value with a segmental position code (e.g. muscle mass
  // arrives as type 76 / position 7), NOT position 0, so we must NOT filter on
  // position — per-segment values live under separate types (173–175) and never
  // collide with these.
  const rows = await prisma.withingsMeasurement.findMany({
    where: { type },
    orderBy: { measuredAt: 'desc' },
    take: 12,
    select: { date: true, value: true },
  })
  if (rows.length === 0) return null

  // Auf distinct Messtage reduzieren (mehrere Messungen am selben Tag → letzte).
  const byDay = new Map<string, { date: Date; value: number }>()
  for (const r of rows) {
    const key = toKey(r.date)
    if (!byDay.has(key)) byDay.set(key, { date: r.date, value: r.value })
  }
  const days = Array.from(byDay.values()).sort((a, b) => b.date.getTime() - a.date.getTime())
  const cur = days[0]
  const prev = days[1] ?? null
  const trend = computeTrend(
    Math.round(cur.value * 10) / 10,
    prev ? Math.round(prev.value * 10) / 10 : null,
  )
  return { value: trend.current, delta: trend.delta, trend: trend.trend, date: toKey(cur.date) }
}

export async function getBodyComposition(): Promise<BodyComposition> {
  const results = await Promise.all(
    COMPOSITION_TYPES.map(async ({ type, key }) => {
      const r = await latestForType(type)
      return r ? { key, ...r } : null
    }),
  )
  const metrics = results.filter((m): m is CompositionMetric => m !== null)
  const latestDate = metrics.reduce<string | null>(
    (acc, m) => (acc == null || m.date > acc ? m.date : acc),
    null,
  )
  return { latestDate, metrics }
}

// --- Segmentale Körperzusammensetzung (Withings Body Scan) -------------------
//
// Bildet die Withings-App-Ansicht nach: pro Körperzone (Arme, Torso, Beine) den
// Fett- bzw. Muskelanteil in %. Withings liefert die Segmentwerte als Massen (kg)
// unter eigenen Typen, unterschieden über `position`:
//   173 = fettfreie Masse (segmental)
//   174 = Fettmasse (segmental)
//   175 = Muskelmasse (segmental)
// Positionscodes (Quelle: aiowithings/Home-Assistant): 2=rechter Arm, 3=linker
// Arm, 10=linkes Bein, 11=rechtes Bein, 12=Torso. Links/rechts werden je Zone
// summiert. Anteil = Masse ÷ (Fettmasse + fettfreie Masse) der Zone — exakt so
// reproduziert die App ihre Prozentwerte (Torso 31.3 % Fett + 65.6 % Muskel …).

const SEG_FAT_FREE = 173
const SEG_FAT = 174
const SEG_MUSCLE = 175

export type BodyZone = 'arms' | 'torso' | 'legs'

/** Withings-Positionscodes je Zone (linke + rechte Gliedmasse werden summiert). */
const ZONE_POSITIONS: Record<BodyZone, number[]> = {
  arms: [2, 3],
  torso: [12],
  legs: [10, 11],
}

export interface ZonePercent {
  /** Fettmasse ÷ (Fett- + fettfreie Masse) × 100. */
  fatPct: number | null
  /** Muskelmasse ÷ (Fett- + fettfreie Masse) × 100. */
  musclePct: number | null
}

interface SegRow {
  type: number
  position: number
  value: number
}

/**
 * Reiner Rechenhelfer: reduziert die Segmentzeilen (Typ 173/174/175) EINES
 * Messtages auf Fett-/Muskelanteile je Zone. Ohne vollständige Fett- und
 * fettfreie-Masse einer Zone → `null` (Anteil nicht berechenbar).
 */
export function computeZonePercentages(rows: SegRow[]): Record<BodyZone, ZonePercent | null> {
  const out = {} as Record<BodyZone, ZonePercent | null>
  for (const zone of Object.keys(ZONE_POSITIONS) as BodyZone[]) {
    const positions = ZONE_POSITIONS[zone]
    let fat = 0
    let fatFree = 0
    let muscle = 0
    let hasFat = false
    let hasFatFree = false
    let hasMuscle = false
    for (const r of rows) {
      if (!positions.includes(r.position)) continue
      if (r.type === SEG_FAT) {
        fat += r.value
        hasFat = true
      } else if (r.type === SEG_FAT_FREE) {
        fatFree += r.value
        hasFatFree = true
      } else if (r.type === SEG_MUSCLE) {
        muscle += r.value
        hasMuscle = true
      }
    }
    const total = fat + fatFree
    if (!hasFat || !hasFatFree || total <= 0) {
      out[zone] = null
      continue
    }
    out[zone] = {
      fatPct: Math.round((fat / total) * 1000) / 10,
      musclePct: hasMuscle ? Math.round((muscle / total) * 1000) / 10 : null,
    }
  }
  return out
}

export interface SegmentZone extends ZonePercent {
  /** Δ Fettanteil zum vorherigen Scan (Prozentpunkte), null ohne Vormessung. */
  fatDelta: number | null
  /** Δ Muskelanteil zum vorherigen Scan (Prozentpunkte), null ohne Vormessung. */
  muscleDelta: number | null
}

export interface SegmentalComposition {
  latestDate: string | null
  zones: Record<BodyZone, SegmentZone | null>
  visceralFat: { value: number; delta: number | null; trend: Trend } | null
  /** Ob mindestens eine Zone berechenbare Werte hat (Waage mit Segmental-Support). */
  hasData: boolean
}

const NO_SEGMENTAL: SegmentalComposition = {
  latestDate: null,
  zones: { arms: null, torso: null, legs: null },
  visceralFat: null,
  hasData: false,
}

export async function getSegmentalComposition(): Promise<SegmentalComposition> {
  // Genug Zeilen für die letzten paar Scans (≈15 Segmentzeilen pro Scan).
  const rows = await prisma.withingsMeasurement.findMany({
    where: { type: { in: [SEG_FAT_FREE, SEG_FAT, SEG_MUSCLE] } },
    orderBy: { measuredAt: 'desc' },
    take: 120,
    select: { type: true, position: true, value: true, date: true },
  })

  // Nach Messtag gruppieren; dayOrder ist durch das desc-Ordering neueste zuerst.
  const byDay = new Map<string, SegRow[]>()
  const dayOrder: string[] = []
  for (const r of rows) {
    const key = toKey(r.date)
    let list = byDay.get(key)
    if (!list) {
      list = []
      byDay.set(key, list)
      dayOrder.push(key)
    }
    list.push({ type: r.type, position: r.position, value: r.value })
  }

  const visceral = await latestForType(170)
  const visceralFat = visceral
    ? { value: visceral.value, delta: visceral.delta, trend: visceral.trend }
    : null

  const latestKey = dayOrder[0]
  if (!latestKey) return { ...NO_SEGMENTAL, visceralFat }

  const cur = computeZonePercentages(byDay.get(latestKey)!)
  const prevKey = dayOrder[1]
  const prev = prevKey ? computeZonePercentages(byDay.get(prevKey)!) : null

  const zones = {} as Record<BodyZone, SegmentZone | null>
  let hasData = false
  for (const zone of ['arms', 'torso', 'legs'] as BodyZone[]) {
    const c = cur[zone]
    if (!c) {
      zones[zone] = null
      continue
    }
    hasData = true
    const p = prev?.[zone] ?? null
    const fatDelta =
      c.fatPct != null && p?.fatPct != null ? Math.round((c.fatPct - p.fatPct) * 10) / 10 : null
    const muscleDelta =
      c.musclePct != null && p?.musclePct != null
        ? Math.round((c.musclePct - p.musclePct) * 10) / 10
        : null
    zones[zone] = { ...c, fatDelta, muscleDelta }
  }

  return { latestDate: latestKey, zones, visceralFat, hasData }
}

// --- Bewegung: trainierte Tage aus Journal-Einträgen -------------------------

const TRAINED_LEVELS: MovementLevel[] = [
  MovementLevel.TRAINED_ONLY,
  MovementLevel.STEPS_TRAINED,
]

export interface TrainingDays {
  /** YYYY-MM-DD aller Tage mit Training im Zeitraum. */
  dates: string[]
  count: number
}

export async function getTrainingDays(days: number): Promise<TrainingDays> {
  const since = dateOnly(new Date(zurichDayStart().getTime() - (days - 1) * 86_400_000))
  const rows = await prisma.journalEntry.findMany({
    where: { date: { gte: since }, movement: { in: TRAINED_LEVELS } },
    orderBy: { date: 'asc' },
    select: { date: true },
  })
  const dates = rows.map((r) => toKey(r.date))
  return { dates, count: dates.length }
}

// --- Nutrition: aktuelle Diät-Phase + Eckdaten ------------------------------

export interface CoachDietPhase {
  mode: PhaseMode
  startDate: string
  endDate: string | null
  note: string | null
  targetKcal: number | null
  proteinG: number | null
  fatG: number | null
  carbsG: number | null
  mealsPerDay: number | null
  deficitMode: DeficitMethod | null
  activityFactor: number | null
  baseWeightKg: number | null
  bodyFatPct: number | null
  calcNote: string | null
}

export async function getCoachDietPhase(): Promise<CoachDietPhase | null> {
  const phase = await getActivePhase()
  if (!phase) return null
  const t = phase.targets
  return {
    mode: phase.mode,
    startDate: toKey(phase.startDate),
    endDate: phase.endDate ? toKey(phase.endDate) : null,
    note: phase.note,
    targetKcal: t ? Math.round(t.targetKcal) : null,
    proteinG: t ? Math.round(t.proteinG) : null,
    fatG: t ? Math.round(t.fatG) : null,
    carbsG: t ? Math.round(t.carbsG) : null,
    mealsPerDay: t?.mealsPerDay ?? null,
    deficitMode: t?.deficitMode ?? null,
    activityFactor: t?.activityFactor ?? null,
    baseWeightKg: t?.baseWeightKg ?? null,
    bodyFatPct: t?.bodyFatPct ?? null,
    calcNote: t?.calcNote ?? null,
  }
}

// --- Nutrition: einzelner Tag (IST/SOLL kcal + Makros + Mahlzeiten) ----------

export interface MacroSet {
  proteinG: number
  carbsG: number
  fatG: number
}

export interface CoachMealEntry {
  id: string
  mealSlot: string | null
  name: string
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
}

export interface CoachNutritionDay {
  date: string
  hasData: boolean
  actualKcal: number | null
  targetKcal: number | null
  actual: MacroSet | null
  target: MacroSet | null
  isRefeed: boolean
  fulfilled: boolean | null
  meals: CoachMealEntry[]
}

export async function getCoachNutritionDay(date: Date): Promise<CoachNutritionDay> {
  const d = dateOnly(date)
  const [day, entries] = await Promise.all([
    prisma.day.findUnique({ where: { date: d } }),
    prisma.mealEntry.findMany({
      where: { day: { date: d } },
      orderBy: { loggedAt: 'asc' },
      include: { foodItem: true, dish: true },
    }),
  ])

  const meals: CoachMealEntry[] = entries.map((e) => ({
    id: e.id,
    mealSlot: e.mealSlot ?? null,
    name: e.foodItem?.name ?? e.dish?.name ?? e.externalName ?? '—',
    kcal: Math.round(e.kcal),
    proteinG: Math.round(e.proteinG),
    carbsG: Math.round(e.carbsG),
    fatG: Math.round(e.fatG),
  }))

  const fulfilled =
    day?.fulfillmentStatus === 'FULFILLED'
      ? true
      : day?.fulfillmentStatus === 'NOT_FULFILLED'
        ? false
        : null

  return {
    date: toKey(d),
    hasData: !!day && (day.actualKcal != null || entries.length > 0),
    actualKcal: day?.actualKcal ?? null,
    targetKcal: day?.targetKcal ?? null,
    actual:
      day && day.actualProteinG != null
        ? {
            proteinG: Math.round(day.actualProteinG),
            carbsG: Math.round(day.actualCarbsG ?? 0),
            fatG: Math.round(day.actualFatG ?? 0),
          }
        : null,
    target:
      day && day.targetProteinG != null
        ? {
            proteinG: Math.round(day.targetProteinG),
            carbsG: Math.round(day.targetCarbsG ?? 0),
            fatG: Math.round(day.targetFatG ?? 0),
          }
        : null,
    isRefeed: day?.dayType === 'REFEED',
    fulfilled,
    meals,
  }
}

/**
 * Tages-Nutrition für die letzten `days` Kalendertage (chronologisch, älteste
 * zuerst) in nur zwei Queries. Speist die Tagesauswahl im Coach-Dashboard.
 */
export async function getCoachNutritionRange(days: number): Promise<CoachNutritionDay[]> {
  const to = dateOnly(zurichDayStart())
  const from = dateOnly(new Date(to.getTime() - (days - 1) * 86_400_000))

  const [dayRows, entries] = await Promise.all([
    prisma.day.findMany({
      where: { date: { gte: from, lte: to } },
      orderBy: { date: 'asc' },
    }),
    prisma.mealEntry.findMany({
      where: { day: { date: { gte: from, lte: to } } },
      orderBy: { loggedAt: 'asc' },
      include: { foodItem: true, dish: true, day: { select: { date: true } } },
    }),
  ])

  const mealsByDay = new Map<string, CoachMealEntry[]>()
  for (const e of entries) {
    const key = toKey(e.day.date)
    const list = mealsByDay.get(key) ?? []
    list.push({
      id: e.id,
      mealSlot: e.mealSlot ?? null,
      name: e.foodItem?.name ?? e.dish?.name ?? e.externalName ?? '—',
      kcal: Math.round(e.kcal),
      proteinG: Math.round(e.proteinG),
      carbsG: Math.round(e.carbsG),
      fatG: Math.round(e.fatG),
    })
    mealsByDay.set(key, list)
  }

  const dayByKey = new Map(dayRows.map((d) => [toKey(d.date), d]))

  const result: CoachNutritionDay[] = []
  for (let i = 0; i < days; i++) {
    const d = dateOnly(new Date(from.getTime() + i * 86_400_000))
    const key = toKey(d)
    const day = dayByKey.get(key) ?? null
    const meals = mealsByDay.get(key) ?? []
    const fulfilled =
      day?.fulfillmentStatus === 'FULFILLED'
        ? true
        : day?.fulfillmentStatus === 'NOT_FULFILLED'
          ? false
          : null
    result.push({
      date: key,
      hasData: !!day && (day.actualKcal != null || meals.length > 0),
      actualKcal: day?.actualKcal ?? null,
      targetKcal: day?.targetKcal ?? null,
      actual:
        day && day.actualProteinG != null
          ? {
              proteinG: Math.round(day.actualProteinG),
              carbsG: Math.round(day.actualCarbsG ?? 0),
              fatG: Math.round(day.actualFatG ?? 0),
            }
          : null,
      target:
        day && day.targetProteinG != null
          ? {
              proteinG: Math.round(day.targetProteinG),
              carbsG: Math.round(day.targetCarbsG ?? 0),
              fatG: Math.round(day.targetFatG ?? 0),
            }
          : null,
      isRefeed: day?.dayType === 'REFEED',
      fulfilled,
      meals,
    })
  }
  return result
}

// --- Nutrition: 7-Tage-Summe (kcal + Makros) --------------------------------

export interface CoachNutritionWeek {
  from: string
  to: string
  daysWithData: number
  actualKcal: number | null // Ø pro geloggtem Tag
  targetKcal: number | null // Ø pro geloggtem Tag
  actual: MacroSet | null // Ø pro geloggtem Tag
  target: MacroSet | null // Ø pro geloggtem Tag
}

export async function getCoachNutritionWeek(): Promise<CoachNutritionWeek> {
  const to = dateOnly(zurichDayStart())
  const from = dateOnly(new Date(to.getTime() - 6 * 86_400_000))

  const rows = await prisma.day.findMany({
    where: {
      date: { gte: from, lte: to },
      fulfillmentStatus: { not: 'OPEN' },
    },
    select: {
      actualKcal: true,
      actualProteinG: true,
      actualCarbsG: true,
      actualFatG: true,
      targetKcal: true,
      targetProteinG: true,
      targetCarbsG: true,
      targetFatG: true,
    },
  })

  const n = rows.length
  if (n === 0) {
    return {
      from: toKey(from),
      to: toKey(to),
      daysWithData: 0,
      actualKcal: null,
      targetKcal: null,
      actual: null,
      target: null,
    }
  }

  const avg = (pick: (r: (typeof rows)[number]) => number | null): number => {
    const vals = rows.map(pick).filter((v): v is number => v != null)
    if (vals.length === 0) return 0
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
  }

  return {
    from: toKey(from),
    to: toKey(to),
    daysWithData: n,
    actualKcal: avg((r) => r.actualKcal),
    targetKcal: avg((r) => r.targetKcal),
    actual: {
      proteinG: avg((r) => r.actualProteinG),
      carbsG: avg((r) => r.actualCarbsG),
      fatG: avg((r) => r.actualFatG),
    },
    target: {
      proteinG: avg((r) => r.targetProteinG),
      carbsG: avg((r) => r.targetCarbsG),
      fatG: avg((r) => r.targetFatG),
    },
  }
}

// --- Körpermasse (Umfänge) mit Tendenz --------------------------------------

const MEASUREMENT_FIELDS = [
  'chest',
  'waist',
  'hip',
  'upperArmLeft',
  'upperArmRight',
  'thighLeft',
  'thighRight',
  'calfLeft',
  'calfRight',
  'neck',
] as const

export type MeasurementField = (typeof MEASUREMENT_FIELDS)[number]

export type BodyMeasurementTrends = {
  latestDate: string | null
  values: Partial<Record<MeasurementField, BodyCompositionEntry>>
}

export async function getBodyMeasurementTrends(): Promise<BodyMeasurementTrends> {
  // Neueste Messungen zuerst; pro Feld letzten + vorletzten erfassten Wert finden.
  const rows = await prisma.bodyMeasurement.findMany({
    orderBy: { date: 'desc' },
    take: 24,
  })
  if (rows.length === 0) return { latestDate: null, values: {} }

  const values: Partial<Record<MeasurementField, BodyCompositionEntry>> = {}
  for (const field of MEASUREMENT_FIELDS) {
    const withValue = rows
      .map((r) => ({ date: r.date, value: r[field] as number | null }))
      .filter((r): r is { date: Date; value: number } => r.value != null)
    if (withValue.length === 0) continue
    const cur = withValue[0]
    const prev = withValue[1] ?? null
    const trend = computeTrend(cur.value, prev?.value ?? null, 0.05)
    values[field] = { ...trend, date: toKey(cur.date), unit: 'cm' }
  }

  return { latestDate: toKey(rows[0].date), values }
}

// --- Gewicht + Körperfett Verlauf (gemergt nach Datum) ----------------------

export interface WeightBodyFatPoint {
  date: string
  weight: number | null
  bodyFat: number | null
}

export async function getWeightBodyFatHistory(days: number): Promise<WeightBodyFatPoint[]> {
  const since = dateOnly(new Date(zurichDayStart().getTime() - (days - 1) * 86_400_000))
  const rows = await prisma.dailyMetrics.findMany({
    where: {
      date: { gte: since },
      OR: [{ weight: { not: null } }, { bodyFat: { not: null } }],
    },
    orderBy: { date: 'asc' },
    select: { date: true, weight: true, bodyFat: true },
  })
  return rows.map((r) => ({
    date: toKey(r.date),
    weight: r.weight ?? null,
    bodyFat: r.bodyFat ?? null,
  }))
}

// --- Körperbilder-Galerie (Metadaten) ---------------------------------------

export interface CoachBodyPhoto {
  id: string
  date: string
  category: string
}

export async function listCoachBodyPhotos(): Promise<CoachBodyPhoto[]> {
  const rows = await prisma.bodyPhoto.findMany({
    orderBy: { date: 'desc' },
    select: { id: true, date: true, category: true },
  })
  return rows.map((r) => ({ id: r.id, date: toKey(r.date), category: r.category }))
}
