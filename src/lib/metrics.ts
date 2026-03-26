import { prisma } from './db'

export interface MetricsSummary {
  latestWeight?: number
  latestBodyFat?: number
  latestBmi?: number
  avgSteps30d?: number
}

export async function getLatestMetrics(): Promise<MetricsSummary> {
  const latest = await prisma.dailyMetrics.findFirst({
    orderBy: { date: 'desc' },
    where: {
      OR: [
        { weight: { not: null } },
        { bodyFat: { not: null } },
      ],
    },
  })

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
