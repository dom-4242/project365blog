'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { createDish, updateDish, removeDish, type DishItemInput } from '@/lib/nutrition/dishes'
import { addDishFavorite, removeDishFavorite } from '@/lib/nutrition/favorites'

export interface ActionResult {
  error?: string
  success?: boolean
  info?: string
}

export interface DishFormData {
  id?: string
  name: string
  note: string
  items: { foodItemId: string; amount: string; unit: string }[]
}

export async function saveDish(data: DishFormData): Promise<ActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  const name = data.name.trim()
  if (!name) return { error: 'Name ist erforderlich.' }

  const items: DishItemInput[] = []
  for (const raw of data.items) {
    if (!raw.foodItemId) continue
    const amount = parseFloat(raw.amount.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) return { error: 'Alle Zutaten brauchen eine Menge > 0.' }
    items.push({ foodItemId: raw.foodItemId, amount, unit: raw.unit || 'g' })
  }
  if (items.length === 0) return { error: 'Mindestens eine Zutat erforderlich.' }

  try {
    if (data.id) await updateDish(data.id, { name, note: data.note.trim() || null, items })
    else await createDish({ name, note: data.note.trim() || null, items })
    revalidatePath('/admin/dishes')
    revalidatePath('/admin/log')
    return { success: true }
  } catch (e) {
    console.error('saveDish:', e)
    return { error: 'Speichern fehlgeschlagen.' }
  }
}

export async function deleteDishAction(id: string): Promise<ActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }
  try {
    const res = await removeDish(id)
    revalidatePath('/admin/dishes')
    revalidatePath('/admin/log')
    return { success: true, info: res === 'archived' ? 'Archiviert (referenziert).' : 'Gelöscht.' }
  } catch (e) {
    console.error('deleteDishAction:', e)
    return { error: 'Löschen fehlgeschlagen.' }
  }
}

export async function toggleDishFavorite(dishId: string, on: boolean): Promise<ActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }
  try {
    if (on) await addDishFavorite(dishId)
    else await removeDishFavorite(dishId)
    revalidatePath('/admin/dishes')
    revalidatePath('/admin/log')
    return { success: true }
  } catch (e) {
    console.error('toggleDishFavorite:', e)
    return { error: 'Favorit fehlgeschlagen.' }
  }
}
