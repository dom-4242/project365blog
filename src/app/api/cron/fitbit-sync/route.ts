import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  syncFitbitDay,
  getYesterdayDate,
  FitbitRateLimitError,
  FitbitAuthError,
} from '@/lib/fitbit'
import { loadFitbitTokens, saveFitbitTokens } from '@/lib/fitbit-tokens'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tokens = await loadFitbitTokens()
  if (!tokens) {
    return NextResponse.json(
      { error: 'Fitbit tokens not configured' },
      { status: 500 },
    )
  }

  const dateParam = request.nextUrl.searchParams.get('date')
  const date = dateParam ?? getYesterdayDate()

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

    return NextResponse.json({
      ok: true,
      date: result.date,
      synced: {
        weight: result.weight,
        bodyFat: result.bodyFat,
        bmi: result.bmi,
        activeMinutes: result.activeMinutes,
        caloriesBurned: result.caloriesBurned,
        distance: result.distance,
        restingHR: result.restingHR,
      },
      tokensRefreshed: !!result.newTokens,
    })
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
    }).catch(() => {}) // Log-Fehler nicht nach oben propagieren

    if (err instanceof FitbitRateLimitError) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfterSeconds: err.retryAfterSeconds },
        { status: 429 },
      )
    }
    if (err instanceof FitbitAuthError) {
      return NextResponse.json({ error: 'Fitbit auth failed', detail: err.message }, { status: 401 })
    }
    console.error('[fitbit-sync] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
