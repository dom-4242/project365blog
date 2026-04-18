import { prisma } from './db'

export interface MetricsSummary {
  latestWeight?: number
  latestBodyFat?: number
  latestBmi?: number
  avgSteps30d?: number
  lastSyncDate?: Date
  weightImportedAt?: Date
  bodyFatImportedAt?: Date
  stepsImportedAt?: Date
  baselineWeight?: number
  baselineBodyFat?: number
}

export async function getLatestMetrics(projectStartDate?: string): Promise<MetricsSummary> {
  const startDate = projectStartDate ? new Date(projectStartDate) : new Date('2020-01-01')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    latestWeightRow,
    latestBodyFatRow,
    latestStepsRow,
    baselineWeightRow,
    baselineBodyFatRow,
    stepsData,
  ] = await Promise.all([
    prisma.dailyMetrics.findFirst({
      orderBy: { date: 'desc' },
      where: { weight: { not: null } },
      select: { weight: true, bmi: true, updatedAt: true },
    }),
    prisma.dailyMetrics.findFirst({
      orderBy: { date: 'desc' },
      where: { bodyFat: { not: null } },
      select: { bodyFat: true, updatedAt: true },
    }),
    prisma.dailyMetrics.findFirst({
      orderBy: { date: 'desc' },
      where: { steps: { not: null } },
      select: { date: true, updatedAt: true },
    }),
    prisma.dailyMetrics.findFirst({
      orderBy: { date: 'asc' },
      where: { date: { gte: startDate }, weight: { not: null } },
      select: { weight: true },
    }),
    prisma.dailyMetrics.findFirst({
      orderBy: { date: 'asc' },
      where: { date: { gte: startDate }, bodyFat: { not: null } },
      select: { bodyFat: true },
    }),
    prisma.dailyMetrics.findMany({
      where: { date: { gte: thirtyDaysAgo }, steps: { not: null } },
      select: { steps: true },
    }),
  ])

  // Fall back to absolute first record when projectStartDate is set to a future
  // date or is otherwise later than all available data.
  const [weightFallback, bodyFatFallback] = await Promise.all([
    baselineWeightRow
      ? Promise.resolve(null)
      : prisma.dailyMetrics.findFirst({
          orderBy: { date: 'asc' },
          where: { weight: { not: null } },
          select: { weight: true },
        }),
    baselineBodyFatRow
      ? Promise.resolve(null)
      : prisma.dailyMetrics.findFirst({
          orderBy: { date: 'asc' },
          where: { bodyFat: { not: null } },
          select: { bodyFat: true },
        }),
  ])

  const avgSteps =
    stepsData.length > 0
      ? Math.round(stepsData.reduce((s, d) => s + (d.steps ?? 0), 0) / stepsData.length)
      : undefined

  return {
    latestWeight: latestWeightRow?.weight ?? undefined,
    latestBodyFat: latestBodyFatRow?.bodyFat ?? undefined,
    latestBmi: latestWeightRow?.bmi ?? undefined,
    avgSteps30d: avgSteps,
    lastSyncDate: latestStepsRow?.date ?? undefined,
    weightImportedAt: latestWeightRow?.updatedAt ?? undefined,
    bodyFatImportedAt: latestBodyFatRow?.updatedAt ?? undefined,
    stepsImportedAt: latestStepsRow?.updatedAt ?? undefined,
    baselineWeight: (baselineWeightRow ?? weightFallback)?.weight ?? undefined,
    baselineBodyFat: (baselineBodyFatRow ?? bodyFatFallback)?.bodyFat ?? undefined,
  }
}

export async function getWeightHistory(days = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  return prisma.dailyMetrics.findMany({
    where: {
      date: { gte: since },
      weight: { not: null },
    },
    orderBy: { date: 'asc' },
    select: { date: true, weight: true },
  })
}

export async function getStepsHistory(days = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  return prisma.dailyMetrics.findMany({
    where: {
      date: { gte: since },
      steps: { not: null },
    },
    orderBy: { date: 'asc' },
    select: { date: true, steps: true },
  })
}

export async function getBodyFatHistory(days = 90) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  return prisma.dailyMetrics.findMany({
    where: {
      date: { gte: since },
      bodyFat: { not: null },
    },
    orderBy: { date: 'asc' },
    select: { date: true, bodyFat: true },
  })
}

export async function getReadingStats(days = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  since.setHours(0, 0, 0, 0)

  const [logs, activeBook, completedThisYear] = await Promise.all([
    prisma.readingLog.findMany({
      where: { date: { gte: since } },
      orderBy: { date: 'asc' },
      select: { date: true, pagesRead: true },
    }),
    prisma.book.findFirst({
      where: { completed: false },
      orderBy: { createdAt: 'desc' },
      include: {
        readingLogs: { select: { pagesRead: true } },
      },
    }),
    prisma.book.count({
      where: {
        completed: true,
        endDate: { gte: new Date(new Date().getFullYear(), 0, 1) },
      },
    }),
  ])

  const pagesPerDay = logs.map((l) => ({
    date: l.date.toISOString().slice(0, 10),
    pages: l.pagesRead,
  }))

  const currentBook = activeBook
    ? {
        title: activeBook.title,
        author: activeBook.author,
        totalPages: activeBook.totalPages,
        pagesRead: activeBook.readingLogs.reduce((s, l) => s + l.pagesRead, 0),
      }
    : null

  return { pagesPerDay, currentBook, booksThisYear: completedThisYear }
}

export async function getBodyMeasurements() {
  return prisma.bodyMeasurement.findMany({
    orderBy: { date: 'asc' },
    select: {
      date: true,
      chest: true,
      waist: true,
      hip: true,
      upperArmLeft: true,
      upperArmRight: true,
      thighLeft: true,
      thighRight: true,
      calfLeft: true,
      calfRight: true,
      neck: true,
    },
  })
}
