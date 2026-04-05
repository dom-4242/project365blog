import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  syncFitbitDay,
  getYesterdayDate,
  FitbitRateLimitError,
  FitbitAuthError,
} from '@/lib/fitbit'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const accessToken = process.env.FITBIT_ACCESS_TOKEN
  const refreshToken = process.env.FITBIT_REFRESH_TOKEN
  if (!accessToken || !refreshToken) {
    return NextResponse.json(
      { error: 'FITBIT_ACCESS_TOKEN / FITBIT_REFRESH_TOKEN not configured' },
      { status: 500 },
    )
  }

  const dateParam = request.nextUrl.searchParams.get('date')
  const date = dateParam ?? getYesterdayDate()

  try {
    const result = await syncFitbitDay(date, { accessToken, refreshToken }, prisma)

    if (result.newTokens) {
      // Tokens were refreshed — log them so the operator can update .env.local
      console.warn(
        '[fitbit-sync] Tokens refreshed. Update FITBIT_ACCESS_TOKEN and FITBIT_REFRESH_TOKEN:\n' +
          `  FITBIT_ACCESS_TOKEN=${result.newTokens.accessToken}\n` +
          `  FITBIT_REFRESH_TOKEN=${result.newTokens.refreshToken}`,
      )
    }

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
