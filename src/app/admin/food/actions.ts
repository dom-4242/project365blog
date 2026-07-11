'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import {
  createFoodItem,
  updateFoodItem,
  removeFoodItem,
  reactivateFoodItem,
  importFood,
  type FoodItemInput,
} from '@/lib/nutrition/food'
import { addFoodFavorite, removeFoodFavorite } from '@/lib/nutrition/favorites'
import type { NormalizedFood } from '@/lib/nutrition/food-provider'

export interface ActionResult {
  error?: string
  success?: boolean
  info?: string
}

/** Formular-Datentyp (Strings), wie in den übrigen Admin-Actions. */
export interface FoodFormData {
  id?: string
  name: string
  brand: string
  barcode: string
  baseUnit: string
  kcal: string
  proteinG: string
  carbsG: string
  fatG: string
  fiberG: string
  sugarG: string
  saturatedFatG: string
  sodiumMg: string
  potassiumMg: string
  ironMg: string
  magnesiumMg: string
  calciumMg: string
  zincMg: string
  vitaminDUg: string
  vitaminB12Ug: string
  vitaminCMg: string
  // Punkt 4: Daten-Qualität (aus der AI-Anreicherung bzw. am Item gespeichert).
  verified?: boolean
  labelImagePath?: string | null
}

function req(val: string): number | null {
  if (!val.trim()) return null
  const n = parseFloat(val.replace(',', '.'))
  return isNaN(n) ? null : n
}

function parseForm(data: FoodFormData): { input: FoodItemInput } | { error: string } {
  const name = data.name.trim()
  if (!name) return { error: 'Name ist erforderlich.' }

  const kcal = req(data.kcal)
  const proteinG = req(data.proteinG)
  const carbsG = req(data.carbsG)
  const fatG = req(data.fatG)
  if (kcal === null || proteinG === null || carbsG === null || fatG === null) {
    return { error: 'Kalorien und Makros (P/KH/F) sind Pflicht.' }
  }
  if ([kcal, proteinG, carbsG, fatG].some((n) => n < 0)) {
    return { error: 'Nährwerte dürfen nicht negativ sein.' }
  }

  return {
    input: {
      name,
      brand: data.brand.trim() || null,
      barcode: data.barcode.trim() || null,
      baseUnit: data.baseUnit || 'g',
      source: 'MANUAL',
      externalDbId: null,
      kcal,
      proteinG,
      carbsG,
      fatG,
      fiberG: req(data.fiberG),
      sugarG: req(data.sugarG),
      saturatedFatG: req(data.saturatedFatG),
      sodiumMg: req(data.sodiumMg),
      potassiumMg: req(data.potassiumMg),
      ironMg: req(data.ironMg),
      magnesiumMg: req(data.magnesiumMg),
      calciumMg: req(data.calciumMg),
      zincMg: req(data.zincMg),
      vitaminDUg: req(data.vitaminDUg),
      vitaminB12Ug: req(data.vitaminB12Ug),
      vitaminCMg: req(data.vitaminCMg),
      verified: data.verified ?? false,
      labelImagePath: data.labelImagePath ?? null,
    },
  }
}

export async function saveFoodItem(data: FoodFormData): Promise<ActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  const parsed = parseForm(data)
  if ('error' in parsed) return parsed

  // Beim manuellen Anlegen bleibt die Quelle MANUAL; beim Bearbeiten eines
  // importierten Eintrags die ursprüngliche Quelle unangetastet lassen wäre
  // ideal — für MVP genügt: neue Einträge MANUAL, Updates behalten Felder.
  try {
    if (data.id) {
      await updateFoodItem(data.id, parsed.input)
    } else {
      await createFoodItem(parsed.input)
    }
    revalidatePath('/admin/food')
    return { success: true }
  } catch (e) {
    if (String(e).includes('Unique constraint') || String(e).includes('barcode')) {
      return { error: 'Ein Produkt mit diesem Barcode existiert bereits.' }
    }
    console.error('saveFoodItem:', e)
    return { error: 'Fehler beim Speichern.' }
  }
}

/** Übernimmt ein OFF-Suchergebnis in den Katalog (Dedup über Barcode). */
export async function importFoodItem(food: NormalizedFood): Promise<ActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  try {
    const { item, created } = await importFood(food)
    revalidatePath('/admin/food')
    return {
      success: true,
      info: created ? `„${item.name}" übernommen.` : `„${item.name}" ist bereits im Katalog.`,
    }
  } catch (e) {
    console.error('importFoodItem:', e)
    return { error: 'Import fehlgeschlagen.' }
  }
}

export async function deleteFoodItem(id: string): Promise<ActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }
  try {
    const result = await removeFoodItem(id)
    revalidatePath('/admin/food')
    return {
      success: true,
      info: result === 'archived' ? 'Archiviert (wird noch referenziert).' : 'Gelöscht.',
    }
  } catch (e) {
    console.error('deleteFoodItem:', e)
    return { error: 'Löschen fehlgeschlagen.' }
  }
}

export async function restoreFoodItem(id: string): Promise<ActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }
  try {
    await reactivateFoodItem(id)
    revalidatePath('/admin/food')
    return { success: true }
  } catch (e) {
    console.error('restoreFoodItem:', e)
    return { error: 'Reaktivieren fehlgeschlagen.' }
  }
}

export async function toggleFoodFavorite(foodItemId: string, on: boolean): Promise<ActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }
  try {
    if (on) await addFoodFavorite(foodItemId)
    else await removeFoodFavorite(foodItemId)
    revalidatePath('/admin/food')
    revalidatePath('/admin/log')
    return { success: true }
  } catch (e) {
    console.error('toggleFoodFavorite:', e)
    return { error: 'Favorit fehlgeschlagen.' }
  }
}
