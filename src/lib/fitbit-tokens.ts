/**
 * Fitbit token persistence via AppSetting table.
 * Tokens survive redeployments and are updated automatically after each refresh.
 */

import { prisma } from '@/lib/db'
import type { FitbitTokens } from '@/lib/fitbit'

const KEY_ACCESS = 'fitbit.accessToken'
const KEY_REFRESH = 'fitbit.refreshToken'

/** Load tokens from DB, falling back to env vars (initial setup). */
export async function loadFitbitTokens(): Promise<FitbitTokens | null> {
  const [accessRow, refreshRow] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: KEY_ACCESS } }),
    prisma.appSetting.findUnique({ where: { key: KEY_REFRESH } }),
  ])

  if (accessRow && refreshRow) {
    return { accessToken: accessRow.value, refreshToken: refreshRow.value }
  }

  // Fall back to env vars (first run before any OAuth)
  const accessToken = process.env.FITBIT_ACCESS_TOKEN
  const refreshToken = process.env.FITBIT_REFRESH_TOKEN
  if (accessToken && refreshToken) {
    return { accessToken, refreshToken }
  }

  return null
}

/** Persist tokens to DB after a successful refresh. */
export async function saveFitbitTokens(tokens: FitbitTokens): Promise<void> {
  await Promise.all([
    prisma.appSetting.upsert({
      where: { key: KEY_ACCESS },
      create: { key: KEY_ACCESS, value: tokens.accessToken },
      update: { value: tokens.accessToken },
    }),
    prisma.appSetting.upsert({
      where: { key: KEY_REFRESH },
      create: { key: KEY_REFRESH, value: tokens.refreshToken },
      update: { value: tokens.refreshToken },
    }),
  ])
}
