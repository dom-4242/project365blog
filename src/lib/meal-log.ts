import { NutritionLevel } from '@prisma/client'
import { prisma } from './db'
import { zurichDateStr } from './timezone'

// =============================================
// Types
// =============================================

export interface MealInput {
  breakfast: number | null
  snackMorning: number | null
  lunch: number | null
  snackAfternoon: number | null
  dinner: number | null
  snack: number | null
}

export interface MealLogData extends MealInput {
  id: string
  date: string // YYYY-MM-DD
  score: number | null
}

export interface MealScoreDay {
  date: string
  score: number | null
}

// =============================================
// Score calculation
// =============================================

export function calculateMealScore(data: MealInput): number {
  const main = [data.breakfast, data.snackMorning, data.lunch, data.snackAfternoon, data.dinner]
  const sum = main.reduce<number>((acc, m) => acc + (m ?? 0), 0)
  const base = (sum / 50) * 10  // 5 meals × max 10 = 50, normalized to 0–10
  const bonus = data.snack ? (data.snack / 10) * 0.5 : 0
  return Math.min(10.0, parseFloat((base + bonus).toFixed(2)))
}

export function scoreToNutritionLevel(score: number): NutritionLevel {
  if (score >= 8.0) return NutritionLevel.THREE_MEALS
  if (score >= 5.0) return NutritionLevel.TWO_MEALS
  if (score >= 2.0) return NutritionLevel.ONE_MEAL
  return NutritionLevel.NONE
}

// =============================================
// DB Queries
// =============================================

export async function getMealLog(dateStr: string): Promise<MealLogData | null> {
  const date = new Date(`${dateStr}T00:00:00.000Z`)
  const row = await prisma.mealLog.findUnique({ where: { date } })
  if (!row) return null
  return {
    id: row.id,
    date: row.date.toISOString().slice(0, 10),
    breakfast: row.breakfast,
    snackMorning: row.snackMorning,
    lunch: row.lunch,
    snackAfternoon: row.snackAfternoon,
    dinner: row.dinner,
    snack: row.snack,
    score: row.score,
  }
}

export async function getMealScoreHistory(days = 30): Promise<MealScoreDay[]> {
  const today = new Date(`${zurichDateStr()}T00:00:00.000Z`)
  const from = new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000)
  const rows = await prisma.mealLog.findMany({
    where: { date: { gte: from, lte: today } },
    orderBy: { date: 'asc' },
    select: { date: true, score: true },
  })
  return rows.map((r) => ({ date: r.date.toISOString().slice(0, 10), score: r.score }))
}

// =============================================
// Per-meal averages (5 main meals, excluding bonus snack)
// =============================================

export type MealSlotKey = 'breakfast' | 'snackMorning' | 'lunch' | 'snackAfternoon' | 'dinner'

export const MAIN_MEAL_KEYS: readonly MealSlotKey[] = [
  'breakfast',
  'snackMorning',
  'lunch',
  'snackAfternoon',
  'dinner',
] as const

export interface MealAverage {
  key: MealSlotKey
  avg30: number | null   // 30-day average, 0–10 (null if no logs)
  avg7: number | null    // last-7-day average, 0–10 (null if no logs)
  trend: number | null   // avg7 − avg30 (null if either missing)
  count30: number        // number of days with a non-null value in window
}

/**
 * Returns the per-meal average score (0–10) over the trailing window,
 * plus the trailing 7-day average and trend (avg7 − avg30) for each main meal.
 * Days where a given meal slot is null are excluded from that meal's average.
 */
export async function getMealAverages(days = 30): Promise<MealAverage[]> {
  const today = new Date(`${zurichDateStr()}T00:00:00.000Z`)
  const from30 = new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000)
  const from7 = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)

  const rows = await prisma.mealLog.findMany({
    where: { date: { gte: from30, lte: today } },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      breakfast: true,
      snackMorning: true,
      lunch: true,
      snackAfternoon: true,
      dinner: true,
    },
  })

  return MAIN_MEAL_KEYS.map((key) => {
    const all: number[] = []
    const last7: number[] = []
    for (const r of rows) {
      const v = r[key]
      if (v === null || v === undefined) continue
      all.push(v)
      if (r.date >= from7) last7.push(v)
    }
    const avg30 = all.length > 0 ? all.reduce((s, n) => s + n, 0) / all.length : null
    const avg7 = last7.length > 0 ? last7.reduce((s, n) => s + n, 0) / last7.length : null
    const trend = avg30 !== null && avg7 !== null ? avg7 - avg30 : null
    return { key, avg30, avg7, trend, count30: all.length }
  })
}

