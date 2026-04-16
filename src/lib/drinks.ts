import { DrinkType } from '@prisma/client'

export const DRINK_VOLUME: Record<DrinkType, number> = {
  WATER: 600,     // ml per bottle
  COLA_ZERO: 330, // ml per can
}

export interface TodayDrinks {
  water: number
  colaZero: number
  waterMl: number
  colaZeroMl: number
}
