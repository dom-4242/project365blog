import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { MetricSource } from '@prisma/client'
import { parseHealthPayload, mergeWithExisting, type HealthPayload, type HealthMetric } from '@/lib/apple-health'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limit: 10 requests per minute per IP (bulk import, rarely called more than once/sync)
  const ip = getClientIp(request)
  const rl = rateLimit(`health-import:POST:${ip}`, 10, 60_000)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) },
      },
    )
  }

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
    console.log('[health-import] Invalid payload — top-level keys:', Object.keys(payload ?? {}))
    if (payload?.data) console.log('[health-import] data keys:', Object.keys(payload.data))
    return NextResponse.json({ error: 'Invalid payload: missing data.metrics' }, { status: 400 })
  }

  const metrics = payload.data.metrics!
  console.log(`[health-import] Received ${metrics.length} metrics:`, metrics.map((m) => m.name))
  if (metrics.length > 0) {
    console.log('[health-import] Sample first entry of first metric:', metrics[0].data?.[0])
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

  // Update inventory for every received metric (fire-and-forget, don't block response)
  void upsertMetricInventory(metrics)

  return NextResponse.json({
    ok: true,
    daysProcessed: dayDataMap.size,
    imported,
    merged,
    skipped,
  })
}

async function upsertMetricInventory(metrics: HealthMetric[]): Promise<void> {
  const now = new Date()
  await Promise.all(
    metrics.map(async (metric) => {
      if (!metric.data || metric.data.length === 0) return

      // Find the most recent entry by date string (format: "yyyy-MM-dd HH:mm:ss Z")
      const sorted = [...metric.data].sort((a, b) => b.date.localeCompare(a.date))
      const last = sorted[0]
      const lastValue = last.qty ?? last.avg ?? last.asleep ?? null
      const lastValueDate = last.date.slice(0, 10)

      await prisma.healthMetricInventory.upsert({
        where: { metricName: metric.name },
        create: {
          metricName: metric.name,
          unit: metric.units ?? '',
          sampleCount: metric.data.length,
          lastValue: lastValue !== null ? lastValue : null,
          lastValueDate,
          lastReceivedAt: now,
        },
        update: {
          unit: metric.units ?? '',
          sampleCount: metric.data.length,
          lastValue: lastValue !== null ? lastValue : null,
          lastValueDate,
          lastReceivedAt: now,
        },
      })
    }),
  )
}
