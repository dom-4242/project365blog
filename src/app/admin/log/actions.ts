'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { dateOnly } from '@/lib/nutrition/day'
import { logFood, logDish, logFavorite, deleteMealEntry } from '@/lib/nutrition/meals'
import { findByBarcode, importFood } from '@/lib/nutrition/food'
import { openFoodFacts } from '@/lib/nutrition/providers/open-food-facts'

export interface ActionResult {
  error?: string
  success?: boolean
}

function guardDate(date: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  return dateOnly(date)
}

export async function logFoodEntry(args: {
  date: string
  foodItemId: string
  amount: number
  mealSlot?: string | null
}): Promise<ActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }
  const d = guardDate(args.date)
  if (!d) return { error: 'Datum ungültig' }
  if (!args.foodItemId) return { error: 'Kein Produkt gewählt' }
  if (!(args.amount > 0)) return { error: 'Menge muss > 0 sein' }
  try {
    await logFood({ date: d, foodItemId: args.foodItemId, amount: args.amount, mealSlot: args.mealSlot })
    revalidatePath('/admin/log')
    return { success: true }
  } catch (e) {
    console.error('logFoodEntry:', e)
    return { error: 'Loggen fehlgeschlagen' }
  }
}

export async function logDishEntry(args: {
  date: string
  dishId: string
  multiplier: number
  mealSlot?: string | null
}): Promise<ActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }
  const d = guardDate(args.date)
  if (!d) return { error: 'Datum ungültig' }
  if (!args.dishId) return { error: 'Kein Gericht gewählt' }
  try {
    await logDish({ date: d, dishId: args.dishId, multiplier: args.multiplier, mealSlot: args.mealSlot })
    revalidatePath('/admin/log')
    return { success: true }
  } catch (e) {
    console.error('logDishEntry:', e)
    return { error: 'Loggen fehlgeschlagen' }
  }
}

export async function quickLogFavorite(args: {
  favoriteId: string
  date: string
  mealSlot?: string | null
}): Promise<ActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }
  const d = guardDate(args.date)
  if (!d) return { error: 'Datum ungültig' }
  try {
    await logFavorite({ favoriteId: args.favoriteId, date: d, mealSlot: args.mealSlot })
    revalidatePath('/admin/log')
    return { success: true }
  } catch (e) {
    console.error('quickLogFavorite:', e)
    return { error: 'Loggen fehlgeschlagen' }
  }
}

/**
 * Scan-to-Log: Barcode → lokaler Katalog oder OFF-Import → als Menge loggen.
 * Verbindet N-03/N-04 mit dem Logging (fremde Produkte via Barcode).
 */
export async function logScannedBarcode(args: {
  barcode: string
  date: string
  amount: number
  mealSlot?: string | null
}): Promise<ActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }
  const d = guardDate(args.date)
  if (!d) return { error: 'Datum ungültig' }
  if (!(args.amount > 0)) return { error: 'Menge muss > 0 sein' }
  const code = args.barcode.trim()
  if (!code) return { error: 'Kein Barcode' }

  try {
    let foodId: string
    const local = await findByBarcode(code)
    if (local) {
      foodId = local.id
    } else {
      const off = await openFoodFacts.lookupByBarcode(code)
      if (!off) return { error: `Barcode ${code} nicht gefunden.` }
      const { item } = await importFood(off)
      foodId = item.id
    }
    await logFood({ date: d, foodItemId: foodId, amount: args.amount, mealSlot: args.mealSlot, sourceType: 'BARCODE' })
    revalidatePath('/admin/log')
    return { success: true }
  } catch (e) {
    console.error('logScannedBarcode:', e)
    return { error: 'Loggen fehlgeschlagen' }
  }
}

export async function removeEntry(id: string): Promise<ActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }
  try {
    await deleteMealEntry(id)
    revalidatePath('/admin/log')
    return { success: true }
  } catch (e) {
    console.error('removeEntry:', e)
    return { error: 'Löschen fehlgeschlagen' }
  }
}
