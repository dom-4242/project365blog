import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  syncFitbitDay,
  getYesterdayDate,
  FitbitRateLimitError,
  FitbitAuthError,
  type FitbitTokens,
} from '@/lib/fitbit'
import { loadFitbitTokens, saveFitbitTokens } from '@/lib/fitbit-tokens'
import { zurichDateStr, zurichYesterdayStr } from '@/lib/timezone'

async function syncDate(
  date: string,
  tokens: FitbitTokens,
): Promise<{ result?: Awaited<ReturnType<typeof syncFitbitDay>>; error?: string; rateLimited?: boolean }> {
  try {
    const result = await syncFitbitDay(date, tokens, prisma)

    if (result.newTokens) {
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
    const { result, error, rateLimited } = await syncDate(dateParam, tokens)
    if (rateLimited) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ ok: true, date: result!.date, synced: result })
  }

  // No date param: sync yesterday then today sequentially so that a token refresh
  // in the first sync is available for the second (Fitbit refresh tokens are single-use).
  const yesterday = zurichYesterdayStr()
  const today = zurichDateStr()

  const r1 = await syncDate(yesterday, tokens)
  if (r1.rateLimited) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  const tokensForToday = r1.result?.newTokens ?? tokens
  const r2 = await syncDate(today, tokensForToday)
  if (r2.rateLimited) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  return NextResponse.json({
    ok: true,
    synced: {
      [yesterday]: r1.result ?? { error: r1.error },
      [today]: r2.result ?? { error: r2.error },
    },
  })
}
