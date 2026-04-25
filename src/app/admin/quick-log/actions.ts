'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { DrinkType } from '@prisma/client'
import { DRINK_VOLUME, type TodayDrinks } from '@/lib/drinks'
import { zurichDayStart, zurichDateStr } from '@/lib/timezone'

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

export async function setSweetsConsumed(value: boolean | null): Promise<{ error?: string }> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  const today = new Date(`${zurichDateStr()}T00:00:00.000Z`)

  if (value === null) {
    await prisma.sweetsLog.deleteMany({ where: { date: today } })
  } else {
    await prisma.sweetsLog.upsert({
      where: { date: today },
      update: { consumed: value },
      create: { date: today, consumed: value },
    })
  }

  revalidatePath('/admin/quick-log')
  revalidatePath('/')
  return {}
}

export async function setSweetsConsumedForDate(
  dateStr: string,
  value: boolean | null
): Promise<{ error?: string }> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  const date = new Date(`${dateStr}T00:00:00.000Z`)

  if (value === null) {
    await prisma.sweetsLog.deleteMany({ where: { date } })
  } else {
    await prisma.sweetsLog.upsert({
      where: { date },
      update: { consumed: value },
      create: { date, consumed: value },
    })
  }

  revalidatePath('/admin/quick-log')
  revalidatePath('/')
  return {}
}

export async function getTodayDrinks(): Promise<TodayDrinks> {
  const start = zurichDayStart()

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
