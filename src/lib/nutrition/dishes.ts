// =============================================================================
// Gerichte (Dish/DishItem) — CRUD & Nährwert-Summe (N-05)
//
// Ein Gericht ist eine benannte Kombination mehrerer FoodItems mit
// Standardmengen (z. B. „Mein Frühstück"). Beim Loggen als Ganzes wird die
// Nährwert-Summe (× Portions-Multiplikator) als MealEntry-Snapshot gespeichert.
// =============================================================================

import type { Dish, DishItem, FoodItem, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { dishSnapshot, type NutrientSnapshot } from './snapshot'

export type DishWithItems = Dish & {
  items: (DishItem & { foodItem: FoodItem })[]
}

export interface DishItemInput {
  foodItemId: string
  amount: number
  unit: string
}

export interface DishInput {
  name: string
  note: string | null
  items: DishItemInput[]
}

const withItems = {
  items: { include: { foodItem: true }, orderBy: { id: 'asc' as const } },
}

export function listDishes(includeArchived = false): Promise<DishWithItems[]> {
  return prisma.dish.findMany({
    where: includeArchived ? undefined : { isActive: true },
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    include: withItems,
  })
}

export function getDish(id: string): Promise<DishWithItems | null> {
  return prisma.dish.findUnique({ where: { id }, include: withItems })
}

export async function createDish(input: DishInput): Promise<DishWithItems> {
  const dish = await prisma.dish.create({
    data: {
      name: input.name,
      note: input.note,
      items: {
        create: input.items.map((i) => ({
          foodItemId: i.foodItemId,
          amount: i.amount,
          unit: i.unit,
        })),
      },
    },
    include: withItems,
  })
  return dish
}

export async function updateDish(id: string, input: DishInput): Promise<DishWithItems> {
  // Zutaten werden komplett ersetzt (delete + recreate) — einfach & konsistent.
  await prisma.$transaction([
    prisma.dishItem.deleteMany({ where: { dishId: id } }),
    prisma.dish.update({
      where: { id },
      data: {
        name: input.name,
        note: input.note,
        items: {
          create: input.items.map((i) => ({
            foodItemId: i.foodItemId,
            amount: i.amount,
            unit: i.unit,
          })),
        },
      },
    }),
  ])
  return (await getDish(id))!
}

/** Archiviert bei Referenzierung (MealEntry/Favorite), sonst Hard-Delete. */
export async function removeDish(id: string): Promise<'archived' | 'deleted'> {
  const [meals, favs] = await prisma.$transaction([
    prisma.mealEntry.count({ where: { dishId: id } }),
    prisma.favorite.count({ where: { dishId: id } }),
  ])
  if (meals > 0 || favs > 0) {
    await prisma.dish.update({ where: { id }, data: { isActive: false } })
    return 'archived'
  }
  await prisma.$transaction([
    prisma.dishItem.deleteMany({ where: { dishId: id } }),
    prisma.dish.delete({ where: { id } }),
  ])
  return 'deleted'
}

/** Nährwert-Summe eines Gerichts (× Multiplikator). */
export function dishTotals(dish: DishWithItems, multiplier = 1): NutrientSnapshot {
  return dishSnapshot(
    dish.items.map((i) => ({ food: i.foodItem, amount: i.amount })),
    multiplier,
  )
}

export type { Prisma }
