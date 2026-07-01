/**
 * Withings token persistence via AppSetting table.
 * Tokens survive redeployments and are updated automatically after each refresh
 * (Withings refresh tokens are single-use and rotate on every refresh).
 */

import { prisma } from '@/lib/db'
import type { WithingsTokens } from '@/lib/withings'

const KEY_ACCESS = 'withings.accessToken'
const KEY_REFRESH = 'withings.refreshToken'

/** Load tokens from DB, falling back to env vars (initial setup). */
export async function loadWithingsTokens(): Promise<WithingsTokens | null> {
  const [accessRow, refreshRow] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: KEY_ACCESS } }),
    prisma.appSetting.findUnique({ where: { key: KEY_REFRESH } }),
  ])

  if (accessRow && refreshRow) {
    return { accessToken: accessRow.value, refreshToken: refreshRow.value }
  }

  // Fall back to env vars (first run before any OAuth)
  const accessToken = process.env.WITHINGS_ACCESS_TOKEN
  const refreshToken = process.env.WITHINGS_REFRESH_TOKEN
  if (accessToken && refreshToken) {
    return { accessToken, refreshToken }
  }

  return null
}

/** Persist tokens to DB after a successful refresh or OAuth exchange. */
export async function saveWithingsTokens(tokens: WithingsTokens): Promise<void> {
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
