// =============================================================================
// Favoriten (N-05) — Schnellzugriff auf FoodItem ODER Dish für die
// 1-Klick-Wiederholung im Logging.
// =============================================================================

import type { Favorite, FoodItem, Dish, DishItem } from '@prisma/client'
import { prisma } from '@/lib/db'

export type FavoriteResolved = Favorite & {
  foodItem: FoodItem | null
  dish: (Dish & { items: (DishItem & { foodItem: FoodItem })[] }) | null
}

const include = {
  foodItem: true,
  dish: { include: { items: { include: { foodItem: true } } } },
}

export function listFavorites(): Promise<FavoriteResolved[]> {
  return prisma.favorite.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include,
  })
}

async function nextSortOrder(): Promise<number> {
  const last = await prisma.favorite.findFirst({ orderBy: { sortOrder: 'desc' } })
  return (last?.sortOrder ?? -1) + 1
}

export async function addFoodFavorite(foodItemId: string): Promise<Favorite | null> {
  const existing = await prisma.favorite.findFirst({ where: { foodItemId } })
  if (existing) return existing
  return prisma.favorite.create({
    data: { targetType: 'food', foodItemId, sortOrder: await nextSortOrder() },
  })
}

export async function addDishFavorite(dishId: string): Promise<Favorite | null> {
  const existing = await prisma.favorite.findFirst({ where: { dishId } })
  if (existing) return existing
  return prisma.favorite.create({
    data: { targetType: 'dish', dishId, sortOrder: await nextSortOrder() },
  })
}

export async function removeFavorite(id: string): Promise<void> {
  await prisma.favorite.delete({ where: { id } })
}

export async function removeFoodFavorite(foodItemId: string): Promise<void> {
  await prisma.favorite.deleteMany({ where: { foodItemId } })
}

export async function removeDishFavorite(dishId: string): Promise<void> {
  await prisma.favorite.deleteMany({ where: { dishId } })
}

/** IDs der aktuell favorisierten Foods/Dishes (für Toggle-Zustände in der UI). */
export async function favoriteIdSets(): Promise<{ foods: Set<string>; dishes: Set<string> }> {
  const favs = await prisma.favorite.findMany({ select: { foodItemId: true, dishId: true } })
  return {
    foods: new Set(favs.map((f) => f.foodItemId).filter((v): v is string => !!v)),
    dishes: new Set(favs.map((f) => f.dishId).filter((v): v is string => !!v)),
  }
}
