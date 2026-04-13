'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { DrinkType } from '@prisma/client'

export const DRINK_VOLUME: Record<DrinkType, number> = {
  WATER: 500,     // ml per bottle
  COLA_ZERO: 330, // ml per can
}

export interface TodayDrinks {
  water: number
  colaZero: number
  waterMl: number
  colaZeroMl: number
}

export async function logDrink(type: DrinkType): Promise<{ error?: string }> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  await prisma.drinkLog.create({
    data: { type, volume: DRINK_VOLUME[type] },
  })

  revalidatePath('/admin/quick-log')
  return {}
}

export async function deleteDrink(id: string): Promise<{ error?: string }> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  await prisma.drinkLog.delete({ where: { id } })
  revalidatePath('/admin/quick-log')
  return {}
}

export async function getTodayDrinks(): Promise<TodayDrinks> {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const rows = await prisma.drinkLog.findMany({
    where: { timestamp: { gte: start } },
    select: { type: true, volume: true },
  })

  const water = rows.filter((r) => r.type === 'WATER').length
  const colaZero = rows.filter((r) => r.type === 'COLA_ZERO').length

  return {
    water,
    colaZero,
    waterMl: water * DRINK_VOLUME.WATER,
    colaZeroMl: colaZero * DRINK_VOLUME.COLA_ZERO,
  }
}
