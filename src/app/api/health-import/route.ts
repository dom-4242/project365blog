import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { MetricSource } from '@prisma/client'
import { parseHealthPayload, mergeWithExisting, type HealthPayload } from '@/lib/apple-health'

export async function POST(request: NextRequest) {
  const expectedKey = process.env.HEALTH_IMPORT_API_KEY
  if (!expectedKey) {
    return NextResponse.json({ error: 'HEALTH_IMPORT_API_KEY not configured' }, { status: 500 })
  }

  // Support both "Authorization: Bearer <key>" and "x-api-key: <key>" headers
  const authHeader = request.headers.get('authorization')
  const providedKey = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : request.headers.get('x-api-key')

  if (providedKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: HealthPayload
  try {
    payload = (await request.json()) as HealthPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!payload?.data?.metrics) {
    return NextResponse.json({ error: 'Invalid payload: missing data.metrics' }, { status: 400 })
  }

  const dayDataMap = parseHealthPayload(payload)

  let imported = 0
  let merged = 0
  let skipped = 0

  for (const [dateStr, dayData] of dayDataMap) {
    if (Object.keys(dayData).length === 0) {
      skipped++
      continue
    }

    const date = new Date(dateStr)
    const existing = await prisma.dailyMetrics.findUnique({ where: { date } })

    if (!existing) {
      await prisma.dailyMetrics.create({
        data: {
          date,
          weight: dayData.weight ?? null,
          bodyFat: dayData.bodyFat ?? null,
          steps: dayData.steps ?? null,
          caloriesBurned: dayData.caloriesBurned ?? null,
          distance: dayData.distance ?? null,
          restingHR: dayData.restingHR ?? null,
          sleepDuration: dayData.sleepDuration ?? null,
          source: MetricSource.APPLE_HEALTH,
        },
      })
      imported++
    } else {
      const merged_ = mergeWithExisting(existing, dayData)
      await prisma.dailyMetrics.update({
        where: { date },
        data: merged_,
      })
      merged++
    }
  }

  return NextResponse.json({
    ok: true,
    daysProcessed: dayDataMap.size,
    imported,
    merged,
    skipped,
  })
}
