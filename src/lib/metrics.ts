import { prisma } from './db'

export interface MetricsSummary {
  latestWeight?: number
  latestBodyFat?: number
  latestBmi?: number
  avgSteps30d?: number
  lastSyncDate?: Date
}

export async function getLatestMetrics(): Promise<MetricsSummary> {
  const [latest, lastSyncRow] = await Promise.all([
    prisma.dailyMetrics.findFirst({
      orderBy: { date: 'desc' },
      where: {
        OR: [
          { weight: { not: null } },
          { bodyFat: { not: null } },
        ],
      },
    }),
    prisma.dailyMetrics.findFirst({
      orderBy: { date: 'desc' },
      select: { date: true },
    }),
  ])

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const stepsData = await prisma.dailyMetrics.findMany({
    where: {
      date: { gte: thirtyDaysAgo },
      steps: { not: null },
    },
    select: { steps: true },
  })

  const avgSteps =
    stepsData.length > 0
      ? Math.round(stepsData.reduce((sum, d) => sum + (d.steps ?? 0), 0) / stepsData.length)
      : undefined

  return {
    latestWeight: latest?.weight ?? undefined,
    latestBodyFat: latest?.bodyFat ?? undefined,
    latestBmi: latest?.bmi ?? undefined,
    avgSteps30d: avgSteps,
    lastSyncDate: lastSyncRow?.date ?? undefined,
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
