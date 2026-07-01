import { MetricSource, type PrismaClient } from '@prisma/client'
import { zurichDateStr, zurichDayStart } from '@/lib/timezone'

// =============================================
// Types
// =============================================

export interface WithingsTokens {
  accessToken: string
  refreshToken: string
}

/** A single resolved measure (realwert = value * 10^unit already applied). */
export interface WithingsMeasure {
  type: number
  value: number
}

/** A measure group as returned by getmeas (one weigh-in / scan). */
export interface WithingsMeasureGroup {
  grpid: bigint
  /** Full timestamp of the measurement. */
  measuredAt: Date
  measures: WithingsMeasure[]
}

export interface WithingsDayResult {
  date: string
  weight?: number
  bodyFat?: number
}

export interface WithingsSyncResult {
  days: WithingsDayResult[]
  /** Total number of raw measures stored across all groups. */
  measureCount: number
  /** Updated tokens if a refresh occurred. */
  newTokens?: WithingsTokens
}

// =============================================
// Measure-type reference (for admin display + future teacher dashboard)
// Values are already resolved (value * 10^unit) before display.
// =============================================

export const MEASURE_WEIGHT = 1
export const MEASURE_FAT_RATIO = 6

export interface MeasureTypeMeta {
  label: string
  unit: string
  category: string
}

export const WITHINGS_MEASURE_TYPES: Record<number, MeasureTypeMeta> = {
  1:   { label: 'Gewicht',                    unit: 'kg',    category: 'Körper' },
  5:   { label: 'Fettfreie Masse',            unit: 'kg',    category: 'Körper' },
  6:   { label: 'Körperfettanteil',           unit: '%',     category: 'Körper' },
  8:   { label: 'Fettmasse',                  unit: 'kg',    category: 'Körper' },
  76:  { label: 'Muskelmasse',                unit: 'kg',    category: 'Körper' },
  77:  { label: 'Körperwasser (Hydration)',   unit: 'kg',    category: 'Körper' },
  88:  { label: 'Knochenmasse',               unit: 'kg',    category: 'Körper' },
  170: { label: 'Viszerales Fett',            unit: '',      category: 'Körper' },
  168: { label: 'Extrazellularwasser',        unit: 'kg',    category: 'Körper' },
  169: { label: 'Intrazellularwasser',        unit: 'kg',    category: 'Körper' },
  174: { label: 'Fettmasse (segmental)',      unit: 'kg',    category: 'Körper' },
  175: { label: 'Muskelmasse (segmental)',    unit: 'kg',    category: 'Körper' },
  11:  { label: 'Herzfrequenz',               unit: 'bpm',   category: 'Herz & Gefässe' },
  91:  { label: 'Pulswellengeschwindigkeit',  unit: 'm/s',   category: 'Herz & Gefässe' },
  155: { label: 'Gefässalter',                unit: 'Jahre', category: 'Herz & Gefässe' },
  123: { label: 'VO₂ Max',                    unit: 'ml/min/kg', category: 'Herz & Gefässe' },
  196: { label: 'Elektrodermale Aktivität (Füsse)', unit: '', category: 'Nerven' },
  4:   { label: 'Körpergrösse',               unit: 'm',     category: 'Körper' },
  9:   { label: 'Blutdruck diastolisch',      unit: 'mmHg',  category: 'Herz & Gefässe' },
  10:  { label: 'Blutdruck systolisch',       unit: 'mmHg',  category: 'Herz & Gefässe' },
  54:  { label: 'SpO₂',                        unit: '%',     category: 'Herz & Gefässe' },
  71:  { label: 'Körpertemperatur',           unit: '°C',    category: 'Körper' },
  73:  { label: 'Hauttemperatur',             unit: '°C',    category: 'Körper' },
}

export function measureTypeLabel(type: number): string {
  return WITHINGS_MEASURE_TYPES[type]?.label ?? `Typ ${type}`
}

// =============================================
// Errors
// =============================================

export class WithingsRateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number = 60) {
    super(`Withings rate limit exceeded. Retry after ${retryAfterSeconds}s`)
    this.name = 'WithingsRateLimitError'
  }
}

export class WithingsAuthError extends Error {
  constructor(message = 'Withings authentication failed') {
    super(message)
    this.name = 'WithingsAuthError'
  }
}

// =============================================
// Envelope handling
// =============================================

const OAUTH_URL = 'https://wbsapi.withings.net/v2/oauth2'
const MEASURE_URL = 'https://wbsapi.withings.net/measure'
const AUTHORIZE_URL = 'https://account.withings.com/oauth2_user/authorize2'
export const WITHINGS_SCOPE = 'user.metrics'

interface WithingsEnvelope<T> {
  status: number
  body?: T
  error?: string
}

/** Unwraps the Withings `{ status, body }` envelope, mapping error codes to typed errors. */
function unwrap<T>(json: WithingsEnvelope<T>): T {
  if (json.status === 0) {
    if (json.body === undefined) throw new Error('Withings response missing body')
    return json.body
  }
  // 401 → invalid/expired token; 601 → too many requests (rate limit)
  if (json.status === 401) throw new WithingsAuthError(json.error ?? 'Invalid or expired token')
  if (json.status === 601) throw new WithingsRateLimitError()
  throw new Error(`Withings API error (status ${json.status})${json.error ? `: ${json.error}` : ''}`)
}

// =============================================
// OAuth
// =============================================

/**
 * Exchanges an authorization code or refresh token for a fresh token pair.
 * Shared by the OAuth callback (authorization_code) and the sync refresh flow.
 */
async function requestToken(params: Record<string, string>): Promise<WithingsTokens> {
  const clientId = process.env.WITHINGS_CLIENT_ID
  const clientSecret = process.env.WITHINGS_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new WithingsAuthError('WITHINGS_CLIENT_ID / WITHINGS_CLIENT_SECRET not configured')
  }

  const response = await fetch(OAUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      action: 'requesttoken',
      client_id: clientId,
      client_secret: clientSecret,
      ...params,
    }),
  })

  if (!response.ok) throw new Error(`Withings token request failed: HTTP ${response.status}`)

  const json = (await response.json()) as WithingsEnvelope<{
    access_token: string
    refresh_token: string
  }>
  const body = unwrap(json)
  return { accessToken: body.access_token, refreshToken: body.refresh_token }
}

/** Exchanges an OAuth authorization code for tokens (used by the callback route). */
export function exchangeWithingsCode(code: string, redirectUri: string): Promise<WithingsTokens> {
  return requestToken({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  })
}

/** Refreshes an expired access token. Withings refresh tokens are single-use (they rotate). */
export function refreshWithingsToken(tokens: WithingsTokens): Promise<WithingsTokens> {
  return requestToken({
    grant_type: 'refresh_token',
    refresh_token: tokens.refreshToken,
  })
}

/** Builds the Withings OAuth authorize URL. */
export function buildWithingsAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.WITHINGS_CLIENT_ID ?? ''
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: WITHINGS_SCOPE,
    redirect_uri: redirectUri,
    state,
  })
  return `${AUTHORIZE_URL}?${params}`
}

// =============================================
// Measure API
// =============================================

interface RawMeasureGroup {
  grpid: number
  date: number
  measures: Array<{ value: number; type: number; unit: number }>
}

/**
 * Fetches all measure groups between two unix timestamps (inclusive).
 * `meastype` is intentionally omitted so Withings returns EVERY available
 * measure type — the Body Scan's full data set is imported.
 */
export async function fetchMeasures(
  startDate: number,
  endDate: number,
  accessToken: string,
): Promise<WithingsMeasureGroup[]> {
  const response = await fetch(MEASURE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      action: 'getmeas',
      category: '1',
      startdate: String(startDate),
      enddate: String(endDate),
    }),
  })

  if (!response.ok) throw new Error(`Withings getmeas failed: HTTP ${response.status}`)

  const json = (await response.json()) as WithingsEnvelope<{ measuregrps: RawMeasureGroup[] }>
  const body = unwrap(json)

  return (body.measuregrps ?? []).map((grp) => ({
    grpid: BigInt(grp.grpid),
    measuredAt: new Date(grp.date * 1000),
    measures: grp.measures.map((m) => ({
      type: m.type,
      // Withings encodes the real value as value * 10^unit (unit is usually negative)
      value: m.value * 10 ** m.unit,
    })),
  }))
}

// =============================================
// Sync orchestration
// =============================================

/** Converts a YYYY-MM-DD string to the unix second at the start of that day in Europe/Zurich. */
function dayStartUnix(dateStr: string): number {
  const noonUtc = new Date(`${dateStr}T12:00:00Z`)
  return Math.floor(zurichDayStart(noonUtc).getTime() / 1000)
}

/**
 * Fetches Withings measures for the inclusive [startDate, endDate] range and:
 *  1. upserts every raw measure into WithingsMeasurement (idempotent on grpid+type)
 *  2. mirrors weight (type 1) + body-fat (type 6) per day into DailyMetrics
 *
 * Handles token refresh transparently — if a refresh occurred, `result.newTokens`
 * is set so the caller can persist them (refresh tokens are single-use).
 */
export async function syncWithingsRange(
  startDate: string,
  endDate: string,
  tokens: WithingsTokens,
  prisma: PrismaClient,
): Promise<WithingsSyncResult> {
  let currentTokens = tokens
  let newTokens: WithingsTokens | undefined

  const startUnix = dayStartUnix(startDate)
  // end of endDate = start of the following day minus 1 second
  const endUnix = dayStartUnix(endDate) + 24 * 3600 - 1

  let groups: WithingsMeasureGroup[]
  try {
    groups = await fetchMeasures(startUnix, endUnix, currentTokens.accessToken)
  } catch (err) {
    if (err instanceof WithingsAuthError) {
      newTokens = await refreshWithingsToken(currentTokens)
      currentTokens = newTokens
      groups = await fetchMeasures(startUnix, endUnix, currentTokens.accessToken)
    } else {
      throw err
    }
  }

  // 1. Persist every raw measure + collect per-day weight/bodyFat.
  let measureCount = 0
  const perDay = new Map<string, { weight?: number; bodyFat?: number }>()

  for (const grp of groups) {
    const dateStr = zurichDateStr(grp.measuredAt)
    const dateOnly = new Date(`${dateStr}T00:00:00Z`)

    for (const m of grp.measures) {
      await prisma.withingsMeasurement.upsert({
        where: { grpid_type: { grpid: grp.grpid, type: m.type } },
        update: { value: m.value, measuredAt: grp.measuredAt, date: dateOnly },
        create: {
          grpid: grp.grpid,
          type: m.type,
          value: m.value,
          measuredAt: grp.measuredAt,
          date: dateOnly,
        },
      })
      measureCount++

      if (m.type === MEASURE_WEIGHT || m.type === MEASURE_FAT_RATIO) {
        const day = perDay.get(dateStr) ?? {}
        if (m.type === MEASURE_WEIGHT) day.weight = m.value
        else day.bodyFat = m.value
        perDay.set(dateStr, day)
      }
    }
  }

  // 2. Mirror weight + body-fat into DailyMetrics (source = WITHINGS).
  const heightCm = (await prisma.userProfile.findUnique({ where: { id: 'singleton' } }))?.heightCm ?? null

  const days: WithingsDayResult[] = []
  for (const [dateStr, { weight, bodyFat }] of perDay) {
    const bmi =
      weight != null && heightCm != null && heightCm > 0
        ? Math.round((weight / (heightCm / 100) ** 2) * 10) / 10
        : undefined

    const data = {
      ...(weight != null ? { weight } : {}),
      ...(bodyFat != null ? { bodyFat } : {}),
      ...(bmi != null ? { bmi } : {}),
      source: MetricSource.WITHINGS,
    }

    await prisma.dailyMetrics.upsert({
      where: { date: new Date(dateStr) },
      update: data,
      create: { date: new Date(dateStr), ...data },
    })

    days.push({ date: dateStr, weight, bodyFat })
  }

  days.sort((a, b) => a.date.localeCompare(b.date))

  return { days, measureCount, newTokens }
}
