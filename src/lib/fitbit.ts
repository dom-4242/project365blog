import { MetricSource, type PrismaClient } from '@prisma/client'

// =============================================
// Types
// =============================================

export interface FitbitTokens {
  accessToken: string
  refreshToken: string
}

export interface FitbitBodyLogEntry {
  bmi: number
  date: string
  fat?: number
  logId: number
  source: string
  time: string
  weight: number
}

export interface FitbitActivitySummary {
  steps: number
  caloriesOut: number
  activityCalories: number
  fairlyActiveMinutes: number
  veryActiveMinutes: number
  restingHeartRate?: number
  distances: Array<{ activity: string; distance: number }>
}

export interface FitbitSyncResult {
  date: string
  weight?: number
  bodyFat?: number
  bmi?: number
  activeMinutes?: number
  caloriesBurned?: number
  distance?: number
  restingHR?: number
  /** Updated tokens if a refresh occurred */
  newTokens?: FitbitTokens
}

// =============================================
// Errors
// =============================================

export class FitbitRateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super(`Fitbit rate limit exceeded. Retry after ${retryAfterSeconds}s`)
    this.name = 'FitbitRateLimitError'
  }
}

export class FitbitAuthError extends Error {
  constructor(message = 'Fitbit authentication failed') {
    super(message)
    this.name = 'FitbitAuthError'
  }
}

// =============================================
// Helpers
// =============================================

export function getYesterdayDate(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function checkRateLimit(response: Response): void {
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') ?? '3600', 10)
    throw new FitbitRateLimitError(retryAfter)
  }
}

// =============================================
// OAuth
// =============================================

export async function refreshFitbitToken(tokens: FitbitTokens): Promise<FitbitTokens> {
  const clientId = process.env.FITBIT_CLIENT_ID
  const clientSecret = process.env.FITBIT_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new FitbitAuthError('FITBIT_CLIENT_ID / FITBIT_CLIENT_SECRET not configured')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refreshToken,
    }),
  })

  checkRateLimit(response)

  if (response.status === 401) {
    throw new FitbitAuthError('Refresh token is invalid or expired')
  }

  if (!response.ok) {
    throw new Error(`Fitbit token refresh failed: ${response.status}`)
  }

  const data = (await response.json()) as { access_token: string; refresh_token: string }
  return { accessToken: data.access_token, refreshToken: data.refresh_token }
}

// =============================================
// API calls
// =============================================

export async function fetchFitbitBodyLog(
  date: string,
  accessToken: string,
): Promise<FitbitBodyLogEntry | null> {
  const response = await fetch(
    `https://api.fitbit.com/1/user/-/body/log/weight/date/${date}.json`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )

  checkRateLimit(response)

  if (response.status === 401) throw new FitbitAuthError()
  if (!response.ok) return null

  const data = (await response.json()) as { weight: FitbitBodyLogEntry[] }
  return data.weight[0] ?? null
}

export async function fetchFitbitActivitySummary(
  date: string,
  accessToken: string,
): Promise<FitbitActivitySummary | null> {
  const response = await fetch(
    `https://api.fitbit.com/1/user/-/activities/date/${date}.json`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )

  checkRateLimit(response)

  if (response.status === 401) throw new FitbitAuthError()
  if (!response.ok) return null

  const data = (await response.json()) as { summary: FitbitActivitySummary }
  return data.summary
}

// =============================================
// Sync orchestration
// =============================================

/**
 * Fetches Fitbit data for `date` and upserts into DailyMetrics.
 * Handles token refresh transparently — if a refresh occurred,
 * `result.newTokens` is set so the caller can persist them.
 */
export async function syncFitbitDay(
  date: string,
  tokens: FitbitTokens,
  prisma: PrismaClient,
): Promise<FitbitSyncResult> {
  let currentTokens = tokens
  let newTokens: FitbitTokens | undefined
  // Shared refresh promise — ensures only one refresh runs even if
  // both concurrent requests get 401 simultaneously.
  let refreshPromise: Promise<FitbitTokens> | null = null

  async function withRefresh<T>(fn: (accessToken: string) => Promise<T>): Promise<T> {
    try {
      return await fn(currentTokens.accessToken)
    } catch (err) {
      if (err instanceof FitbitAuthError) {
        if (!refreshPromise) {
          refreshPromise = refreshFitbitToken(currentTokens)
        }
        newTokens = await refreshPromise
        currentTokens = newTokens
        return fn(currentTokens.accessToken)
      }
      throw err
    }
  }

  const [bodyLog, activitySummary] = await Promise.all([
    withRefresh((token) => fetchFitbitBodyLog(date, token)),
    withRefresh((token) => fetchFitbitActivitySummary(date, token)),
  ])

  const totalDistance =
    activitySummary?.distances.find((d) => d.activity === 'total')?.distance ?? undefined
  const activeMinutes =
    activitySummary != null
      ? activitySummary.fairlyActiveMinutes + activitySummary.veryActiveMinutes
      : undefined

  const metricsData = {
    weight: bodyLog?.weight ?? null,
    bodyFat: bodyLog?.fat ?? null,
    bmi: bodyLog?.bmi ?? null,
    // Steps are tracked exclusively via Apple Watch (Apple Health) — Fitbit steps ignored
    activeMinutes: activeMinutes ?? null,
    caloriesBurned: activitySummary?.caloriesOut ?? null,
    distance: totalDistance ?? null,
    restingHR: activitySummary?.restingHeartRate ?? null,
    source: MetricSource.FITBIT,
  }

  await prisma.dailyMetrics.upsert({
    where: { date: new Date(date) },
    update: metricsData,
    create: { date: new Date(date), ...metricsData },
  })

  return {
    date,
    weight: bodyLog?.weight,
    bodyFat: bodyLog?.fat,
    bmi: bodyLog?.bmi,
    activeMinutes,
    caloriesBurned: activitySummary?.caloriesOut,
    distance: totalDistance,
    restingHR: activitySummary?.restingHeartRate,
    newTokens,
  }
}
