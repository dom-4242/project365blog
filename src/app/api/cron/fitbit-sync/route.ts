import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  syncFitbitDay,
  getYesterdayDate,
  FitbitRateLimitError,
  FitbitAuthError,
} from '@/lib/fitbit'
import { loadFitbitTokens, saveFitbitTokens } from '@/lib/fitbit-tokens'
import { zurichDateStr, zurichYesterdayStr } from '@/lib/timezone'

async function syncDate(
  date: string,
  tokens: Awaited<ReturnType<typeof loadFitbitTokens>>,
  isFirstSync: boolean,
): Promise<{ result?: Awaited<ReturnType<typeof syncFitbitDay>>; error?: string; rateLimited?: boolean }> {
  try {
    const result = await syncFitbitDay(date, tokens!, prisma)

    if (result.newTokens && isFirstSync) {
      await saveFitbitTokens(result.newTokens)
      console.log('[fitbit-sync] Tokens refreshed and persisted to DB.')
    }

    await prisma.fitbitSyncLog.create({
      data: {
        triggeredBy: 'CRON',
        syncDate: result.date,
        status: 'SUCCESS',
        weight: result.weight ?? null,
        bodyFat: result.bodyFat ?? null,
        bmi: result.bmi ?? null,
        activeMinutes: result.activeMinutes ?? null,
        caloriesBurned: result.caloriesBurned ?? null,
        distance: result.distance ?? null,
        restingHR: result.restingHR ?? null,
        tokensRefreshed: !!result.newTokens,
      },
    })

    return { result }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)

    await prisma.fitbitSyncLog.create({
      data: {
        triggeredBy: 'CRON',
        syncDate: date,
        status: 'ERROR',
        errorMessage: err instanceof FitbitRateLimitError
          ? `Rate limit exceeded (retry after ${err.retryAfterSeconds}s)`
          : err instanceof FitbitAuthError
            ? `Auth failed: ${errorMessage}`
            : errorMessage,
      },
    }).catch(() => {})

    if (err instanceof FitbitRateLimitError) return { rateLimited: true }
    return { error: errorMessage }
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tokens = await loadFitbitTokens()
  if (!tokens) {
    return NextResponse.json({ error: 'Fitbit tokens not configured' }, { status: 500 })
  }

  const dateParam = request.nextUrl.searchParams.get('date')

  // Explicit date: sync only that day (used by manual trigger / admin)
  if (dateParam) {
    const { result, error, rateLimited } = await syncDate(dateParam, tokens, true)
    if (rateLimited) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ ok: true, date: result!.date, synced: result })
  }

  // No date param: sync yesterday + today (both in Zurich timezone) for fresh data
  const yesterday = zurichYesterdayStr()
  const today = zurichDateStr()

  const [r1, r2] = await Promise.all([
    syncDate(yesterday, tokens, true),
    syncDate(today, tokens, false),
  ])

  if (r1.rateLimited || r2.rateLimited) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  return NextResponse.json({
    ok: true,
    synced: {
      [yesterday]: r1.result ?? { error: r1.error },
      [today]: r2.result ?? { error: r2.error },
    },
  })
}
