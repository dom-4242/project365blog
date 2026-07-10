// =============================================================================
// FoodItem-Katalog — CRUD, Import & Dedup (N-03)
//
// Dedup läuft über den (uniquen) Barcode: ein Import mit vorhandenem Barcode
// legt kein Duplikat an, sondern liefert den bestehenden Eintrag. FoodItems
// werden bei Referenzierung nie hart gelöscht, sondern archiviert (isActive).
// =============================================================================

import type { FoodItem, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import type { NormalizedFood } from './food-provider'

/** Eingabe für manuelles Anlegen/Bearbeiten eines FoodItems. */
export interface FoodItemInput {
  name: string
  brand: string | null
  barcode: string | null
  baseUnit: string
  source: FoodItem['source']
  externalDbId: string | null
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number | null
  sugarG: number | null
  saturatedFatG: number | null
  sodiumMg: number | null
  potassiumMg: number | null
  ironMg: number | null
  magnesiumMg: number | null
  calciumMg: number | null
  zincMg: number | null
  vitaminDUg: number | null
  vitaminB12Ug: number | null
  vitaminCMg: number | null
}

function toData(input: FoodItemInput): Prisma.FoodItemCreateInput {
  return {
    name: input.name,
    brand: input.brand,
    barcode: input.barcode || null,
    baseUnit: input.baseUnit,
    source: input.source,
    externalDbId: input.externalDbId,
    kcal: input.kcal,
    proteinG: input.proteinG,
    carbsG: input.carbsG,
    fatG: input.fatG,
    fiberG: input.fiberG,
    sugarG: input.sugarG,
    saturatedFatG: input.saturatedFatG,
    sodiumMg: input.sodiumMg,
    potassiumMg: input.potassiumMg,
    ironMg: input.ironMg,
    magnesiumMg: input.magnesiumMg,
    calciumMg: input.calciumMg,
    zincMg: input.zincMg,
    vitaminDUg: input.vitaminDUg,
    vitaminB12Ug: input.vitaminB12Ug,
    vitaminCMg: input.vitaminCMg,
  }
}

export function normalizedToInput(f: NormalizedFood): FoodItemInput {
  return { ...f }
}

/** Findet ein aktives FoodItem anhand des Barcodes (oder null). */
export function findByBarcode(barcode: string): Promise<FoodItem | null> {
  return prisma.foodItem.findUnique({ where: { barcode } })
}

/**
 * Import eines normalisierten Produkts. Dedup über Barcode:
 * existiert bereits ein FoodItem mit dem Barcode, wird dieses zurückgegeben
 * (kein Duplikat). Ohne Barcode wird immer neu angelegt.
 */
export async function importFood(
  f: NormalizedFood,
): Promise<{ item: FoodItem; created: boolean }> {
  if (f.barcode) {
    const existing = await prisma.foodItem.findUnique({ where: { barcode: f.barcode } })
    if (existing) return { item: existing, created: false }
  }
  const item = await prisma.foodItem.create({ data: toData(normalizedToInput(f)) })
  return { item, created: true }
}

export function createFoodItem(input: FoodItemInput): Promise<FoodItem> {
  return prisma.foodItem.create({ data: toData(input) })
}

export function updateFoodItem(id: string, input: FoodItemInput): Promise<FoodItem> {
  return prisma.foodItem.update({ where: { id }, data: toData(input) })
}

/**
 * Archiviert oder löscht ein FoodItem. Referenziert (DishItem/MealEntry/
 * Favorite) → nur archivieren (isActive=false); sonst hart löschbar.
 */
export async function removeFoodItem(id: string): Promise<'archived' | 'deleted'> {
  const refs = await prisma.$transaction([
    prisma.dishItem.count({ where: { foodItemId: id } }),
    prisma.mealEntry.count({ where: { foodItemId: id } }),
    prisma.favorite.count({ where: { foodItemId: id } }),
  ])
  const referenced = refs.some((c) => c > 0)
  if (referenced) {
    await prisma.foodItem.update({ where: { id }, data: { isActive: false } })
    return 'archived'
  }
  await prisma.foodItem.delete({ where: { id } })
  return 'deleted'
}

export function reactivateFoodItem(id: string): Promise<FoodItem> {
  return prisma.foodItem.update({ where: { id }, data: { isActive: true } })
}

export function listFoodItems(includeArchived = false): Promise<FoodItem[]> {
  return prisma.foodItem.findMany({
    where: includeArchived ? undefined : { isActive: true },
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
  })
}

/** Lokale Katalog-Suche (Name/Marke/Barcode), nur aktive Einträge. */
export function searchLocalFoodItems(query: string, limit = 20): Promise<FoodItem[]> {
  const q = query.trim()
  if (!q) return Promise.resolve([])
  return prisma.foodItem.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { barcode: { contains: q } },
      ],
    },
    orderBy: { name: 'asc' },
    take: limit,
  })
}
