// =============================================================================
// Mahlzeit-Logging (N-05) — MealEntry mit immutablem Nährwert-Snapshot.
//
// Beim Loggen wird der Snapshot aus FoodItem/Dish × Menge berechnet und fest
// am MealEntry gespeichert. Spätere Katalog-Korrekturen ändern bestehende
// Einträge nicht (Snapshot-Prinzip, Notion-Spec Teil 3).
// =============================================================================

import type { MealEntry, FoodItem, Dish, MealSource } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getOrCreateDay } from './day'
import { scaleNutrients } from './snapshot'
import { dishTotals, getDish } from './dishes'

/** Standardmenge für die 1-Klick-Wiederholung eines Food-Favoriten. */
export const DEFAULT_FOOD_AMOUNT = 100

export type MealEntryResolved = MealEntry & {
  foodItem: FoodItem | null
  dish: Dish | null
}

const include = { foodItem: true, dish: true }

export interface LogFoodArgs {
  date: Date
  foodItemId: string
  amount: number
  mealSlot?: string | null
  sourceType?: MealSource
}

export async function logFood(args: LogFoodArgs): Promise<MealEntry> {
  const food = await prisma.foodItem.findUnique({ where: { id: args.foodItemId } })
  if (!food) throw new Error('FoodItem nicht gefunden')
  if (args.amount <= 0) throw new Error('Menge muss > 0 sein')

  const day = await getOrCreateDay(args.date)
  const snap = scaleNutrients(food, args.amount)

  return prisma.mealEntry.create({
    data: {
      dayId: day.id,
      foodItemId: food.id,
      amount: args.amount,
      unit: food.baseUnit,
      mealSlot: args.mealSlot ?? null,
      sourceType: args.sourceType ?? 'MANUAL',
      ...snap,
    },
  })
}

export interface LogDishArgs {
  date: Date
  dishId: string
  multiplier?: number
  mealSlot?: string | null
}

export async function logDish(args: LogDishArgs): Promise<MealEntry> {
  const dish = await getDish(args.dishId)
  if (!dish) throw new Error('Gericht nicht gefunden')
  const multiplier = args.multiplier && args.multiplier > 0 ? args.multiplier : 1

  const day = await getOrCreateDay(args.date)
  const snap = dishTotals(dish, multiplier)

  return prisma.mealEntry.create({
    data: {
      dayId: day.id,
      dishId: dish.id,
      amount: multiplier,
      unit: 'Portion',
      mealSlot: args.mealSlot ?? null,
      sourceType: 'DISH',
      ...snap,
    },
  })
}

/** 1-Klick-Wiederholung: Favorit auf einen Tag loggen (Menge optional). */
export async function logFavorite(args: {
  favoriteId: string
  date: Date
  mealSlot?: string | null
  amount?: number
}): Promise<MealEntry> {
  const fav = await prisma.favorite.findUnique({ where: { id: args.favoriteId } })
  if (!fav) throw new Error('Favorit nicht gefunden')

  if (fav.foodItemId) {
    return logFood({
      date: args.date,
      foodItemId: fav.foodItemId,
      amount: args.amount ?? DEFAULT_FOOD_AMOUNT,
      mealSlot: args.mealSlot,
      sourceType: 'FAVORITE',
    })
  }
  if (fav.dishId) {
    return logDish({
      date: args.date,
      dishId: fav.dishId,
      multiplier: args.amount ?? 1,
      mealSlot: args.mealSlot,
    })
  }
  throw new Error('Favorit ohne Ziel')
}

export async function deleteMealEntry(id: string): Promise<void> {
  await prisma.mealEntry.delete({ where: { id } })
}

export function listDayEntries(date: Date): Promise<MealEntryResolved[]> {
  return prisma.mealEntry.findMany({
    where: { day: { date } },
    orderBy: { loggedAt: 'asc' },
    include,
  })
}

export interface DayTotals {
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  count: number
}

/** IST-Tagessumme aus den MealEntry-Snapshots (Vorstufe zur N-07-Aggregation). */
export function sumEntries(entries: Pick<MealEntry, 'kcal' | 'proteinG' | 'carbsG' | 'fatG'>[]): DayTotals {
  const t = entries.reduce(
    (acc, e) => ({
      kcal: acc.kcal + e.kcal,
      proteinG: acc.proteinG + e.proteinG,
      carbsG: acc.carbsG + e.carbsG,
      fatG: acc.fatG + e.fatG,
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  )
  const r1 = (n: number) => Math.round(n * 10) / 10
  return {
    kcal: r1(t.kcal),
    proteinG: r1(t.proteinG),
    carbsG: r1(t.carbsG),
    fatG: r1(t.fatG),
    count: entries.length,
  }
}
