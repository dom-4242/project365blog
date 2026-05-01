'use server'

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
  const base = (sum / 25) * 5
  const bonus = data.snack ? (data.snack / 5) * 0.3 : 0
  return Math.min(5.0, parseFloat((base + bonus).toFixed(2)))
}

export function scoreToNutritionLevel(score: number): NutritionLevel {
  if (score >= 4.0) return NutritionLevel.THREE_MEALS
  if (score >= 2.5) return NutritionLevel.TWO_MEALS
  if (score >= 1.0) return NutritionLevel.ONE_MEAL
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
// Server Action
// =============================================

export async function saveMealLogAction(dateStr: string, input: MealInput) {
  const date = new Date(`${dateStr}T00:00:00.000Z`)
  const score = calculateMealScore(input)
  const nutritionLevel = scoreToNutritionLevel(score)

  await prisma.mealLog.upsert({
    where: { date },
    create: { date, ...input, score },
    update: { ...input, score },
  })

  // Auto-update JournalEntry nutrition if one exists for this date
  const entry = await prisma.journalEntry.findFirst({
    where: { date: { gte: date, lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) } },
  })
  if (entry) {
    await prisma.journalEntry.update({
      where: { id: entry.id },
      data: { nutrition: nutritionLevel },
    })
  }
}
