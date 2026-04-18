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

// ─── Analytics ────────────────────────────────────────────────────────────

export interface DrinkDayData {
  date: string   // YYYY-MM-DD
  waterMl: number
  colaZeroMl: number
}

export interface DrinkDayStat {
  date: string
  ml: number
}

export interface DrinkStats {
  total: number
  avg: number
  maxDay: DrinkDayStat | null
  minDay: DrinkDayStat | null
  streak: number
}

export interface DrinkAnalytics {
  days: DrinkDayData[]
  waterStats: DrinkStats
  colaStats: DrinkStats
}

function buildStats(
  days: DrinkDayData[],
  key: 'waterMl' | 'colaZeroMl',
  threshold: number,
  moreIsBetter: boolean,
): DrinkStats {
  if (days.length === 0) return { total: 0, avg: 0, maxDay: null, minDay: null, streak: 0 }

  const pairs = days.map((d) => ({ date: d.date, ml: d[key] }))
  const total = pairs.reduce((s, d) => s + d.ml, 0)
  const avg = Math.round(total / days.length)

  const sorted = [...pairs].sort((a, b) => a.ml - b.ml)
  const minDay = sorted[0]
  const maxDay = sorted[sorted.length - 1]

  let maxStreak = 0, cur = 0
  for (const d of pairs) {
    const met = moreIsBetter ? d.ml >= threshold : d.ml <= threshold
    cur = met ? cur + 1 : 0
    if (cur > maxStreak) maxStreak = cur
  }

  return { total, avg, maxDay, minDay, streak: maxStreak }
}

export async function getDrinkAnalytics(days: number | 'all'): Promise<DrinkAnalytics> {
  const tz = 'Europe/Zurich'
  const todayStart = zurichDayStart()
  const since = days === 'all'
    ? undefined
    : new Date(todayStart.getTime() - days * 24 * 60 * 60 * 1000)

  const rows = await prisma.drinkLog.findMany({
    where: { timestamp: { ...(since ? { gte: since } : {}), lt: todayStart } },
    select: { type: true, volume: true, timestamp: true },
    orderBy: { timestamp: 'asc' },
  })

  // Aggregate by Zurich calendar day
  const dayMap = new Map<string, { water: number; cola: number }>()
  for (const row of rows) {
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(row.timestamp)
    const entry = dayMap.get(date) ?? { water: 0, cola: 0 }
    if (row.type === 'WATER') entry.water += row.volume
    else entry.cola += row.volume
    dayMap.set(date, entry)
  }

  // Build ordered day list, filling zeros for missing days
  const daysList: DrinkDayData[] = []
  const rangeStart = since ?? (rows[0]
    ? new Date(new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(rows[0].timestamp) + 'T00:00:00Z')
    : todayStart)

  let cur = new Date(rangeStart)
  while (cur < todayStart) {
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(cur)
    const entry = dayMap.get(date) ?? { water: 0, cola: 0 }
    daysList.push({ date, waterMl: entry.water, colaZeroMl: entry.cola })
    cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000)
  }

  return {
    days: daysList,
    waterStats: buildStats(daysList, 'waterMl', WATER_DAILY_TARGET_ML, true),
    colaStats: buildStats(daysList, 'colaZeroMl', COLA_ZERO_DAILY_LIMIT_ML, false),
  }
}

export async function getSweetsHistory(days = 90): Promise<(boolean | null)[]> {
  const todayStart = zurichDayStart()
  const since = new Date(todayStart.getTime() - days * 24 * 60 * 60 * 1000)

  const rows = await prisma.sweetsLog.findMany({
    where: { date: { gte: since } },
    select: { date: true, consumed: true },
    orderBy: { date: 'desc' },
  })

  const byDate = new Map(rows.map((r) => [r.date.toISOString().slice(0, 10), r.consumed]))

  const result: (boolean | null)[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    result.push(byDate.get(key) ?? null)
  }

  return result
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
