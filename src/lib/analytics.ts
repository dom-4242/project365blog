import { createHash } from 'crypto'
import { prisma } from '@/lib/db'

// =============================================
// Types
// =============================================

export interface ViewsDataPoint {
  date: string
  views: number
  sessions: number
}

export interface TopPage {
  path: string
  views: number
  sessions: number
}

export interface TopReferrer {
  referrer: string
  count: number
}

// =============================================
// Privacy utilities
// =============================================

const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /crawling/i,
  /curl\//i,
  /wget\//i,
  /python/i,
  /node-fetch/i,
  /axios/i,
  /go-http/i,
  /java\//i,
  /libwww/i,
  /headless/i,
  /phantomjs/i,
  /selenium/i,
]

export function isBot(ua: string): boolean {
  if (!ua || ua.trim().length === 0) return true
  return BOT_PATTERNS.some((p) => p.test(ua))
}

export function hashSession(ip: string, ua: string, date: string, salt: string): string {
  return createHash('sha256').update(`${ip}:${ua}:${date}:${salt}`).digest('hex')
}

export function normalizePath(path: string): string {
  // /de/journal/foo → /journal/foo, /de → /
  return path.replace(/^\/(de|en)(\/|$)/, '/') || '/'
}

export function extractDomain(referrer: string): string | null {
  try {
    const url = new URL(referrer)
    return url.hostname || null
  } catch {
    return null
  }
}

// =============================================
// Analytics queries
// =============================================

export async function getAnalyticsSummary() {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOf7Days = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000)
  const startOf30Days = new Date(startOfToday.getTime() - 29 * 24 * 60 * 60 * 1000)

  const [todayRows, last7dRows, last30dRows, total] = await Promise.all([
    prisma.pageView.findMany({
      where: { timestamp: { gte: startOfToday } },
      select: { sessionHash: true },
    }),
    prisma.pageView.findMany({
      where: { timestamp: { gte: startOf7Days } },
      select: { sessionHash: true },
    }),
    prisma.pageView.findMany({
      where: { timestamp: { gte: startOf30Days } },
      select: { sessionHash: true },
    }),
    prisma.pageView.count(),
  ])

  return {
    viewsToday: todayRows.length,
    sessionsToday: new Set(todayRows.map((v) => v.sessionHash)).size,
    viewsLast7d: last7dRows.length,
    sessionsLast7d: new Set(last7dRows.map((v) => v.sessionHash)).size,
    viewsLast30d: last30dRows.length,
    sessionsLast30d: new Set(last30dRows.map((v) => v.sessionHash)).size,
    viewsTotal: total,
  }
}

export async function getViewsPerDay(days: number): Promise<ViewsDataPoint[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days + 1)
  startDate.setHours(0, 0, 0, 0)

  const rows = await prisma.pageView.findMany({
    where: { timestamp: { gte: startDate } },
    select: { timestamp: true, sessionHash: true },
    orderBy: { timestamp: 'asc' },
  })

  // Group by UTC date
  const byDate = new Map<string, { views: number; sessions: Set<string> }>()
  for (const row of rows) {
    const date = row.timestamp.toISOString().slice(0, 10)
    if (!byDate.has(date)) byDate.set(date, { views: 0, sessions: new Set() })
    const d = byDate.get(date)!
    d.views++
    d.sessions.add(row.sessionHash)
  }

  // Build result with all days (fill zeros for missing days)
  const result: ViewsDataPoint[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
    const dateStr = d.toISOString().slice(0, 10)
    const data = byDate.get(dateStr)
    result.push({
      date: dateStr,
      views: data?.views ?? 0,
      sessions: data?.sessions.size ?? 0,
    })
  }
  return result
}

export async function getTopPages(limit = 10, days = 30): Promise<TopPage[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const rows = await prisma.pageView.findMany({
    where: { timestamp: { gte: startDate } },
    select: { path: true, sessionHash: true },
  })

  const byPath = new Map<string, { views: number; sessions: Set<string> }>()
  for (const row of rows) {
    if (!byPath.has(row.path)) byPath.set(row.path, { views: 0, sessions: new Set() })
    const d = byPath.get(row.path)!
    d.views++
    d.sessions.add(row.sessionHash)
  }

  return Array.from(byPath.entries())
    .map(([path, data]) => ({ path, views: data.views, sessions: data.sessions.size }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit)
}

export async function getTopReferrers(limit = 10, days = 30): Promise<TopReferrer[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const rows = await prisma.pageView.findMany({
    where: { timestamp: { gte: startDate }, referrer: { not: null } },
    select: { referrer: true },
  })

  const byReferrer = new Map<string, number>()
  for (const row of rows) {
    const ref = row.referrer ?? ''
    byReferrer.set(ref, (byReferrer.get(ref) ?? 0) + 1)
  }

  return Array.from(byReferrer.entries())
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
