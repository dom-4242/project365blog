import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  syncWithingsRange,
  WithingsRateLimitError,
  WithingsAuthError,
} from '@/lib/withings'
import { loadWithingsTokens, saveWithingsTokens } from '@/lib/withings-tokens'
import { zurichDateStr, zurichYesterdayStr } from '@/lib/timezone'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tokens = await loadWithingsTokens()
  if (!tokens) {
    return NextResponse.json({ error: 'Withings tokens not configured' }, { status: 500 })
  }

  const dateParam = request.nextUrl.searchParams.get('date')
  const start = dateParam ?? zurichYesterdayStr()
  const end = dateParam ?? zurichDateStr()

  try {
    const result = await syncWithingsRange(start, end, tokens, prisma)

    if (result.newTokens) {
      await saveWithingsTokens(result.newTokens)
      console.log('[withings-sync] Tokens refreshed and persisted to DB.')
    }

    const lastDay = result.days[result.days.length - 1]
    await prisma.withingsSyncLog.create({
      data: {
        triggeredBy: 'CRON',
        syncDate: start === end ? start : `${start} → ${end}`,
        status: 'SUCCESS',
        weight: lastDay?.weight ?? null,
        bodyFat: lastDay?.bodyFat ?? null,
        measureCount: result.measureCount,
        tokensRefreshed: !!result.newTokens,
      },
    })

    return NextResponse.json({ ok: true, synced: result.days, measureCount: result.measureCount })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)

    await prisma.withingsSyncLog
      .create({
        data: {
          triggeredBy: 'CRON',
          syncDate: start === end ? start : `${start} → ${end}`,
          status: 'ERROR',
          errorMessage:
            err instanceof WithingsRateLimitError
              ? `Rate limit exceeded (retry after ${err.retryAfterSeconds}s)`
              : err instanceof WithingsAuthError
                ? `Auth failed: ${errorMessage}`
                : errorMessage,
        },
      })
      .catch(() => {})

    if (err instanceof WithingsRateLimitError) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
