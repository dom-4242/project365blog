'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import {
  syncFitbitDay,
  FitbitRateLimitError,
  FitbitAuthError,
  type FitbitSyncResult,
} from '@/lib/fitbit'

export interface SyncActionResult {
  error?: string
  rateLimitSeconds?: number
  results?: FitbitSyncResult[]
  tokensRefreshed?: boolean
}

function getTokens() {
  const accessToken = process.env.FITBIT_ACCESS_TOKEN
  const refreshToken = process.env.FITBIT_REFRESH_TOKEN
  if (!accessToken || !refreshToken) return null
  return { accessToken, refreshToken }
}

export async function syncDay(date: string): Promise<SyncActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  const tokens = getTokens()
  if (!tokens) return { error: 'FITBIT_ACCESS_TOKEN / FITBIT_REFRESH_TOKEN nicht konfiguriert' }

  try {
    const result = await syncFitbitDay(date, tokens, prisma)
    if (result.newTokens) {
      console.warn(
        '[fitbit-sync] Tokens refreshed. Update env vars:\n' +
          `  FITBIT_ACCESS_TOKEN=${result.newTokens.accessToken}\n` +
          `  FITBIT_REFRESH_TOKEN=${result.newTokens.refreshToken}`,
      )
    }
    revalidatePath('/admin/fitbit')
    revalidatePath('/admin/metrics')
    return { results: [result], tokensRefreshed: !!result.newTokens }
  } catch (err) {
    if (err instanceof FitbitRateLimitError) {
      return { error: 'Rate Limit erreicht', rateLimitSeconds: err.retryAfterSeconds }
    }
    if (err instanceof FitbitAuthError) {
      return { error: `Auth-Fehler: ${err.message}` }
    }
    console.error('[fitbit-sync]', err)
    return { error: 'Unbekannter Fehler' }
  }
}

export async function syncRange(startDate: string, endDate: string): Promise<SyncActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  const tokens = getTokens()
  if (!tokens) return { error: 'FITBIT_ACCESS_TOKEN / FITBIT_REFRESH_TOKEN nicht konfiguriert' }

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return { error: 'Ungültige Daten' }
  if (start > end) return { error: 'Startdatum muss vor Enddatum liegen' }

  // Cap at 30 days to avoid rate-limit issues
  const diffDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
  if (diffDays > 30) return { error: 'Maximal 30 Tage auf einmal synchronisieren' }

  const results: FitbitSyncResult[] = []
  let tokensRefreshed = false
  let currentTokens = tokens

  for (let i = 0; i < diffDays; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)

    try {
      const result = await syncFitbitDay(dateStr, currentTokens, prisma)
      if (result.newTokens) {
        currentTokens = result.newTokens
        tokensRefreshed = true
        console.warn(
          '[fitbit-sync] Tokens refreshed during backfill. Update env vars:\n' +
            `  FITBIT_ACCESS_TOKEN=${result.newTokens.accessToken}\n` +
            `  FITBIT_REFRESH_TOKEN=${result.newTokens.refreshToken}`,
        )
      }
      results.push(result)
    } catch (err) {
      if (err instanceof FitbitRateLimitError) {
        return {
          error: `Rate Limit bei ${dateStr} erreicht`,
          rateLimitSeconds: err.retryAfterSeconds,
          results,
          tokensRefreshed,
        }
      }
      if (err instanceof FitbitAuthError) {
        return { error: `Auth-Fehler bei ${dateStr}: ${err.message}`, results, tokensRefreshed }
      }
      return { error: `Fehler bei ${dateStr}`, results, tokensRefreshed }
    }
  }

  revalidatePath('/admin/fitbit')
  revalidatePath('/admin/metrics')
  return { results, tokensRefreshed }
}
