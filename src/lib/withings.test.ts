import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import {
  refreshWithingsToken,
  fetchMeasures,
  syncWithingsRange,
  WithingsRateLimitError,
  WithingsAuthError,
  type WithingsTokens,
} from './withings'

// =============================================
// Mock helpers
// =============================================

/** Withings always returns HTTP 200 with a `{ status, body }` envelope. */
function mockEnvelope(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ status, body }),
  })
}

const TOKENS: WithingsTokens = {
  accessToken: 'access-abc',
  refreshToken: 'refresh-xyz',
}

// June 30 2026, 06:00 UTC → 08:00 Europe/Zurich (DST) → date 2026-06-30
const MEASURE_UNIX = Math.floor(Date.UTC(2026, 5, 30, 6, 0, 0) / 1000)

const MEASURE_BODY = {
  measuregrps: [
    {
      grpid: 987654,
      date: MEASURE_UNIX,
      measures: [
        { value: 85200, type: 1, unit: -3 },                 // 85.2 kg (whole body, no position)
        { value: 223, type: 6, unit: -1 },                   // 22.3 % body fat
        { value: 34500, type: 76, unit: -3, position: 7 },   // 34.5 kg muscle (whole body)
        { value: 4470, type: 175, unit: -2, position: 11 },  // 44.7 kg segmental muscle (arm)
        { value: 4460, type: 175, unit: -2, position: 2 },   // 44.6 kg segmental muscle (leg)
      ],
    },
  ],
}

// =============================================
// refreshWithingsToken
// =============================================

describe('refreshWithingsToken', () => {
  beforeEach(() => {
    process.env.WITHINGS_CLIENT_ID = 'client-id'
    process.env.WITHINGS_CLIENT_SECRET = 'client-secret'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.WITHINGS_CLIENT_ID
    delete process.env.WITHINGS_CLIENT_SECRET
  })

  it('returns new tokens on success', async () => {
    vi.stubGlobal(
      'fetch',
      mockEnvelope(0, { access_token: 'new-access', refresh_token: 'new-refresh' }),
    )
    const result = await refreshWithingsToken(TOKENS)
    expect(result.accessToken).toBe('new-access')
    expect(result.refreshToken).toBe('new-refresh')
  })

  it('sends action=requesttoken with client credentials', async () => {
    const fetchMock = mockEnvelope(0, { access_token: 'a', refresh_token: 'b' })
    vi.stubGlobal('fetch', fetchMock)
    await refreshWithingsToken(TOKENS)
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = (options.body as URLSearchParams)
    expect(body.get('action')).toBe('requesttoken')
    expect(body.get('grant_type')).toBe('refresh_token')
    expect(body.get('client_id')).toBe('client-id')
  })

  it('throws WithingsAuthError on status 401', async () => {
    vi.stubGlobal('fetch', mockEnvelope(401, null))
    await expect(refreshWithingsToken(TOKENS)).rejects.toThrow(WithingsAuthError)
  })

  it('throws WithingsRateLimitError on status 601', async () => {
    vi.stubGlobal('fetch', mockEnvelope(601, null))
    await expect(refreshWithingsToken(TOKENS)).rejects.toThrow(WithingsRateLimitError)
  })

  it('throws WithingsAuthError when env vars are missing', async () => {
    delete process.env.WITHINGS_CLIENT_ID
    await expect(refreshWithingsToken(TOKENS)).rejects.toThrow(WithingsAuthError)
  })
})

// =============================================
// fetchMeasures
// =============================================

describe('fetchMeasures', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('resolves value * 10^unit for every measure', async () => {
    vi.stubGlobal('fetch', mockEnvelope(0, MEASURE_BODY))
    const groups = await fetchMeasures(0, 1, 'token')
    expect(groups).toHaveLength(1)
    expect(groups[0].grpid).toBe(BigInt(987654))
    expect(groups[0].measures).toHaveLength(5)
    const weight = groups[0].measures.find((m) => m.type === 1)!
    expect(weight.value).toBeCloseTo(85.2)
    expect(groups[0].measures.find((m) => m.type === 6)!.value).toBeCloseTo(22.3)
  })

  it('defaults position to 0 when absent and preserves segmental positions', async () => {
    vi.stubGlobal('fetch', mockEnvelope(0, MEASURE_BODY))
    const groups = await fetchMeasures(0, 1, 'token')
    // whole-body weight has no position field → 0
    expect(groups[0].measures.find((m) => m.type === 1)!.position).toBe(0)
    // segmental muscle mass keeps its distinct positions
    const segments = groups[0].measures.filter((m) => m.type === 175).map((m) => m.position).sort((a, b) => a - b)
    expect(segments).toEqual([2, 11])
  })

  it('returns empty array when no measure groups', async () => {
    vi.stubGlobal('fetch', mockEnvelope(0, { measuregrps: [] }))
    const groups = await fetchMeasures(0, 1, 'token')
    expect(groups).toEqual([])
  })

  it('sends Bearer token and getmeas action', async () => {
    const fetchMock = mockEnvelope(0, { measuregrps: [] })
    vi.stubGlobal('fetch', fetchMock)
    await fetchMeasures(100, 200, 'my-token')
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://wbsapi.withings.net/measure')
    expect((options.headers as Record<string, string>)['Authorization']).toBe('Bearer my-token')
    expect((options.body as URLSearchParams).get('action')).toBe('getmeas')
  })

  it('throws WithingsAuthError on status 401', async () => {
    vi.stubGlobal('fetch', mockEnvelope(401, null))
    await expect(fetchMeasures(0, 1, 'token')).rejects.toThrow(WithingsAuthError)
  })

  it('throws WithingsRateLimitError on status 601', async () => {
    vi.stubGlobal('fetch', mockEnvelope(601, null))
    await expect(fetchMeasures(0, 1, 'token')).rejects.toThrow(WithingsRateLimitError)
  })
})

// =============================================
// syncWithingsRange
// =============================================

describe('syncWithingsRange', () => {
  afterEach(() => vi.unstubAllGlobals())

  function makePrismaMock(heightCm: number | null = 180) {
    const measurementUpsert = vi.fn().mockResolvedValue({})
    const dailyUpsert = vi.fn().mockResolvedValue({})
    const prisma = {
      withingsMeasurement: { upsert: measurementUpsert },
      dailyMetrics: { upsert: dailyUpsert },
      userProfile: { findUnique: vi.fn().mockResolvedValue(heightCm != null ? { heightCm } : null) },
    } as unknown as PrismaClient
    return { prisma, measurementUpsert, dailyUpsert }
  }

  it('stores every raw measure and mirrors weight/bodyFat into DailyMetrics', async () => {
    vi.stubGlobal('fetch', mockEnvelope(0, MEASURE_BODY))
    const { prisma, measurementUpsert, dailyUpsert } = makePrismaMock(180)

    const result = await syncWithingsRange('2026-06-30', '2026-06-30', TOKENS, prisma)

    // 5 raw measures stored — segmental values are NOT collapsed
    expect(measurementUpsert).toHaveBeenCalledTimes(5)
    expect(result.measureCount).toBe(5)

    // The two type-175 segments use distinct (grpid, type, position) keys
    const seg175 = measurementUpsert.mock.calls
      .map((c) => c[0].where.grpid_type_position)
      .filter((k: { type: number }) => k.type === 175)
      .map((k: { position: number }) => k.position)
      .sort((a: number, b: number) => a - b)
    expect(seg175).toEqual([2, 11])

    // DailyMetrics mirrored once for the day
    expect(dailyUpsert).toHaveBeenCalledOnce()
    const call = dailyUpsert.mock.calls[0][0]
    expect(call.create.weight).toBeCloseTo(85.2)
    expect(call.create.bodyFat).toBeCloseTo(22.3)
    expect(call.create.bmi).toBeCloseTo(26.3, 1) // 85.2 / 1.8^2
    expect(call.create.source).toBe('WITHINGS')

    expect(result.days).toEqual([{ date: '2026-06-30', weight: 85.2, bodyFat: 22.3 }])
    expect(result.newTokens).toBeUndefined()
  })

  it('omits bmi when height is unknown', async () => {
    vi.stubGlobal('fetch', mockEnvelope(0, MEASURE_BODY))
    const { prisma, dailyUpsert } = makePrismaMock(null)

    await syncWithingsRange('2026-06-30', '2026-06-30', TOKENS, prisma)
    const call = dailyUpsert.mock.calls[0][0]
    expect(call.create.bmi).toBeUndefined()
  })

  it('refreshes token once on auth error and sets newTokens', async () => {
    process.env.WITHINGS_CLIENT_ID = 'cid'
    process.env.WITHINGS_CLIENT_SECRET = 'csecret'

    const fetchMock = vi
      .fn()
      // getmeas → 401 envelope
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ status: 401 }) })
      // token refresh
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 0, body: { access_token: 'new-access', refresh_token: 'new-refresh' } }),
      })
      // getmeas retry → success
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ status: 0, body: MEASURE_BODY }) })
    vi.stubGlobal('fetch', fetchMock)

    const { prisma } = makePrismaMock(180)
    const result = await syncWithingsRange('2026-06-30', '2026-06-30', TOKENS, prisma)

    expect(result.newTokens?.accessToken).toBe('new-access')
    expect(result.newTokens?.refreshToken).toBe('new-refresh')
    expect(result.days[0].weight).toBeCloseTo(85.2)

    const refreshCalls = fetchMock.mock.calls.filter(
      (args) => (args as unknown[])[0] === 'https://wbsapi.withings.net/v2/oauth2',
    )
    expect(refreshCalls).toHaveLength(1)

    delete process.env.WITHINGS_CLIENT_ID
    delete process.env.WITHINGS_CLIENT_SECRET
  })
})
