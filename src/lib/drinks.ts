import { DrinkType } from '@prisma/client'
import { prisma } from './db'
import { zurichDayStart } from './timezone'

export const DRINK_VOLUME: Record<DrinkType, number> = {
  WATER: 600,     // ml per bottle
  COLA_ZERO: 330, // ml per can
}

export const WATER_DAILY_TARGET_ML = 2500
export const COLA_ZERO_DAILY_LIMIT_ML = 660

export interface TodayDrinks {
  water: number
  colaZero: number
  waterMl: number
  colaZeroMl: number
}

export interface DrinkAvg7d {
  waterMl: number
  colaZeroMl: number
}

export async function getDrinkAvg7d(): Promise<DrinkAvg7d> {
  const todayStart = zurichDayStart()
  const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)

  const rows = await prisma.drinkLog.findMany({
    where: { timestamp: { gte: sevenDaysAgo, lt: todayStart } },
    select: { type: true, volume: true },
  })

  const waterTotal = rows.filter((r) => r.type === 'WATER').reduce((s, r) => s + r.volume, 0)
  const colaTotal  = rows.filter((r) => r.type === 'COLA_ZERO').reduce((s, r) => s + r.volume, 0)

  return {
    waterMl: Math.round(waterTotal / 7),
    colaZeroMl: Math.round(colaTotal / 7),
  }
}
