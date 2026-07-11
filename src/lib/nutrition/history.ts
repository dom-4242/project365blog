// =============================================================================
// Verlaufs-Auswertung & Kalibrierung (N-10)
//
// Sammelt SOLL/IST (kcal + Makros) je Tag aus den Day-Aggregaten und den
// Gewichtsverlauf aus DailyMetrics. Reine Helfer (gleitender Schnitt,
// 14-Tage-Kalibrierung) sind ausgelagert und getestet.
// =============================================================================

import type { FulfillmentStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { zurichDayStart } from '@/lib/timezone'
import { dateOnly } from './day'

export interface HistoryPoint {
  date: string // YYYY-MM-DD
  targetKcal: number | null
  actualKcal: number | null
  targetProteinG: number | null
  actualProteinG: number | null
  targetCarbsG: number | null
  actualCarbsG: number | null
  targetFatG: number | null
  actualFatG: number | null
  fulfillmentStatus: FulfillmentStatus
  isRefeed: boolean
  weight: number | null
  /** Gleitender 7-Tage-Gewichtsschnitt (trailing, aus vorhandenen Messungen). */
  weightAvg: number | null
}

export type CalibrationTendency = 'deficit' | 'maintenance' | 'surplus' | 'insufficient_data'

export interface Calibration {
  tendency: CalibrationTendency
  week1Avg: number | null
  week2Avg: number | null
  /** week2 − week1 in kg (negativ = Abnahme). */
  deltaKg: number | null
  daysWithWeight: number
}

/** Kalibrierungs-Schwelle: |Δ| < 0,2 kg über die Woche ≈ Erhalt. */
export const CALIBRATION_BAND_KG = 0.2

const r1 = (n: number) => Math.round(n * 10) / 10

/** 'YYYY-MM-DD' aus einem @db.Date-Wert (UTC). */
function toKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Alle Tage im Bereich [from, to] als YYYY-MM-DD, aufsteigend. */
function dateRange(from: Date, to: Date): string[] {
  const out: string[] = []
  const cur = new Date(from)
  while (cur.getTime() <= to.getTime()) {
    out.push(toKey(cur))
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return out
}

/**
 * Trailing gleitender Schnitt über `window` Tage. Nutzt nur vorhandene
 * Messungen im Fenster; Tage ohne Messung tragen nichts bei. Ergebnis ist
 * null, solange keine Messung im Fenster liegt.
 */
export function trailingWeightAverage(
  series: { date: string; weight: number | null }[],
  window = 7,
): (number | null)[] {
  return series.map((_, i) => {
    const start = Math.max(0, i - window + 1)
    let sum = 0
    let n = 0
    for (let j = start; j <= i; j++) {
      const w = series[j].weight
      if (w != null) {
        sum += w
        n++
      }
    }
    return n > 0 ? r1(sum / n) : null
  })
}

/**
 * 14-Tage-Kalibrierung: Durchschnittsgewicht der älteren 7 Tage (Woche 1) vs.
 * der jüngeren 7 Tage (Woche 2). Erwartet die letzten (bis zu) 14 Tage,
 * aufsteigend sortiert. Δ = Woche2 − Woche1.
 */
export function computeCalibration(
  series: { weight: number | null }[],
  bandKg = CALIBRATION_BAND_KG,
): Calibration {
  const last14 = series.slice(-14)
  const daysWithWeight = last14.filter((p) => p.weight != null).length

  const half = Math.ceil(last14.length / 2)
  const week1 = last14.slice(0, half)
  const week2 = last14.slice(half)

  const avg = (arr: { weight: number | null }[]): number | null => {
    const vals = arr.map((p) => p.weight).filter((w): w is number => w != null)
    if (vals.length === 0) return null
    return r1(vals.reduce((a, b) => a + b, 0) / vals.length)
  }

  const week1Avg = avg(week1)
  const week2Avg = avg(week2)

  if (week1Avg == null || week2Avg == null) {
    return { tendency: 'insufficient_data', week1Avg, week2Avg, deltaKg: null, daysWithWeight }
  }

  const deltaKg = r1(week2Avg - week1Avg)
  let tendency: CalibrationTendency
  if (deltaKg <= -bandKg) tendency = 'deficit'
  else if (deltaKg >= bandKg) tendency = 'surplus'
  else tendency = 'maintenance'

  return { tendency, week1Avg, week2Avg, deltaKg, daysWithWeight }
}

export interface NutritionHistory {
  points: HistoryPoint[]
  calibration: Calibration
}

/**
 * Verlaufsdaten der letzten `days` Tage (Default 30), lückenlos aufgefüllt.
 * Tage ohne Log/Messung erscheinen mit null-Werten.
 */
export async function getNutritionHistory(days = 30): Promise<NutritionHistory> {
  const today = zurichDayStart()
  const to = dateOnly(today)
  const from = dateOnly(new Date(to.getTime() - (days - 1) * 86_400_000))

  const [dayRows, metricRows] = await Promise.all([
    prisma.day.findMany({
      where: { date: { gte: from, lte: to } },
      select: {
        date: true,
        targetKcal: true,
        actualKcal: true,
        targetProteinG: true,
        actualProteinG: true,
        targetCarbsG: true,
        actualCarbsG: true,
        targetFatG: true,
        actualFatG: true,
        fulfillmentStatus: true,
        dayType: true,
      },
      orderBy: { date: 'asc' },
    }),
    prisma.dailyMetrics.findMany({
      where: { date: { gte: from, lte: to }, weight: { not: null } },
      select: { date: true, weight: true },
      orderBy: { date: 'asc' },
    }),
  ])

  const dayByKey = new Map(dayRows.map((r) => [toKey(r.date), r]))
  const weightByKey = new Map(metricRows.map((r) => [toKey(r.date), r.weight ?? null]))

  const keys = dateRange(from, to)
  const weightSeries = keys.map((k) => ({ date: k, weight: weightByKey.get(k) ?? null }))
  const weightAvg = trailingWeightAverage(weightSeries, 7)

  const points: HistoryPoint[] = keys.map((k, i) => {
    const d = dayByKey.get(k)
    return {
      date: k,
      targetKcal: d?.targetKcal ?? null,
      actualKcal: d?.actualKcal ?? null,
      targetProteinG: d?.targetProteinG ?? null,
      actualProteinG: d?.actualProteinG ?? null,
      targetCarbsG: d?.targetCarbsG ?? null,
      actualCarbsG: d?.actualCarbsG ?? null,
      targetFatG: d?.targetFatG ?? null,
      actualFatG: d?.actualFatG ?? null,
      fulfillmentStatus: d?.fulfillmentStatus ?? 'OPEN',
      isRefeed: d?.dayType === 'REFEED',
      weight: weightSeries[i].weight,
      weightAvg: weightAvg[i],
    }
  })

  const calibration = computeCalibration(weightSeries)

  return { points, calibration }
}
