'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import {
  syncWithingsRange,
  WithingsRateLimitError,
  WithingsAuthError,
  type WithingsDayResult,
} from '@/lib/withings'
import { loadWithingsTokens, saveWithingsTokens } from '@/lib/withings-tokens'

export interface SyncActionResult {
  error?: string
  rateLimitSeconds?: number
  days?: WithingsDayResult[]
  measureCount?: number
  tokensRefreshed?: boolean
}

async function runSync(startDate: string, endDate: string): Promise<SyncActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  const tokens = await loadWithingsTokens()
  if (!tokens) return { error: 'Withings Tokens nicht konfiguriert' }

  const syncDate = startDate === endDate ? startDate : `${startDate} → ${endDate}`

  try {
    const result = await syncWithingsRange(startDate, endDate, tokens, prisma)
    if (result.newTokens) {
      await saveWithingsTokens(result.newTokens)
    }

    const lastDay = result.days[result.days.length - 1]
    await prisma.withingsSyncLog.create({
      data: {
        triggeredBy: 'MANUAL',
        syncDate,
        status: 'SUCCESS',
        weight: lastDay?.weight ?? null,
        bodyFat: lastDay?.bodyFat ?? null,
        measureCount: result.measureCount,
        tokensRefreshed: !!result.newTokens,
      },
    })

    revalidatePath('/admin/withings')
    revalidatePath('/admin/metrics')
    return {
      days: result.days,
      measureCount: result.measureCount,
      tokensRefreshed: !!result.newTokens,
    }
  } catch (err) {
    await prisma.withingsSyncLog
      .create({
        data: {
          triggeredBy: 'MANUAL',
          syncDate,
          status: 'ERROR',
          errorMessage: err instanceof Error ? err.message : String(err),
        },
      })
      .catch(() => {})

    if (err instanceof WithingsRateLimitError) {
      return { error: 'Rate Limit erreicht', rateLimitSeconds: err.retryAfterSeconds }
    }
    if (err instanceof WithingsAuthError) {
      return { error: `Auth-Fehler: ${err.message}` }
    }
    console.error('[withings-sync]', err)
    return { error: 'Unbekannter Fehler' }
  }
}

export async function syncDay(date: string): Promise<SyncActionResult> {
  return runSync(date, date)
}

export async function syncRange(startDate: string, endDate: string): Promise<SyncActionResult> {
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return { error: 'Ungültige Daten' }
  if (start > end) return { error: 'Startdatum muss vor Enddatum liegen' }

  // Cap at 90 days per backfill run
  const diffDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
  if (diffDays > 90) return { error: 'Maximal 90 Tage auf einmal synchronisieren' }

  return runSync(startDate, endDate)
}
