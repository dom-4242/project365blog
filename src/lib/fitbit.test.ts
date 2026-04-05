import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import {
  refreshFitbitToken,
  fetchFitbitBodyLog,
  fetchFitbitActivitySummary,
  syncFitbitDay,
  getYesterdayDate,
  FitbitRateLimitError,
  FitbitAuthError,
  type FitbitTokens,
} from './fitbit'

// =============================================
// Mock helpers
// =============================================

function mockFetch(status: number, body: unknown, headers: Record<string, string> = {}) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (key: string) => headers[key] ?? null,
    },
    json: () => Promise.resolve(body),
  })
}

const TOKENS: FitbitTokens = {
  accessToken: 'access-abc',
  refreshToken: 'refresh-xyz',
}

const BODY_LOG_RESPONSE = {
  weight: [
    {
      bmi: 27.5,
      date: '2026-03-25',
      fat: 22.3,
      logId: 123456,
      source: 'Aria',
      time: '07:30:00',
      weight: 85.2,
    },
  ],
}

const ACTIVITY_RESPONSE = {
  summary: {
    steps: 11234,
    caloriesOut: 2450,
    activityCalories: 650,
    fairlyActiveMinutes: 20,
    veryActiveMinutes: 35,
    restingHeartRate: 58,
    distances: [
      { activity: 'total', distance: 8.4 },
      { activity: 'tracker', distance: 8.4 },
    ],
  },
}

// =============================================
// getYesterdayDate
// =============================================

describe('getYesterdayDate', () => {
  it('returns a YYYY-MM-DD string', () => {
    expect(getYesterdayDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns yesterday relative to today', () => {
    const expected = new Date()
    expected.setDate(expected.getDate() - 1)
    expect(getYesterdayDate()).toBe(expected.toISOString().slice(0, 10))
  })
})

// =============================================
// refreshFitbitToken
// =============================================

describe('refreshFitbitToken', () => {
  beforeEach(() => {
    process.env.FITBIT_CLIENT_ID = 'client-id'
    process.env.FITBIT_CLIENT_SECRET = 'client-secret'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.FITBIT_CLIENT_ID
    delete process.env.FITBIT_CLIENT_SECRET
  })

  it('returns new tokens on success', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch(200, { access_token: 'new-access', refresh_token: 'new-refresh' }),
    )

    const result = await refreshFitbitToken(TOKENS)
    expect(result.accessToken).toBe('new-access')
    expect(result.refreshToken).toBe('new-refresh')
  })

  it('sends Basic auth header', async () => {
    const fetchMock = mockFetch(200, { access_token: 'a', refresh_token: 'b' })
    vi.stubGlobal('fetch', fetchMock)

    await refreshFitbitToken(TOKENS)
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    const auth = (options.headers as Record<string, string>)['Authorization']
    expect(auth).toMatch(/^Basic /)
  })

  it('throws FitbitAuthError on 401', async () => {
    vi.stubGlobal('fetch', mockFetch(401, {}))
    await expect(refreshFitbitToken(TOKENS)).rejects.toThrow(FitbitAuthError)
  })

  it('throws FitbitRateLimitError on 429', async () => {
    vi.stubGlobal('fetch', mockFetch(429, {}, { 'Retry-After': '1800' }))
    await expect(refreshFitbitToken(TOKENS)).rejects.toThrow(FitbitRateLimitError)
  })

  it('includes retryAfterSeconds in FitbitRateLimitError', async () => {
    vi.stubGlobal('fetch', mockFetch(429, {}, { 'Retry-After': '1800' }))
    const err = await refreshFitbitToken(TOKENS).catch((e) => e)
    expect(err.retryAfterSeconds).toBe(1800)
  })

  it('throws FitbitAuthError when env vars are missing', async () => {
    delete process.env.FITBIT_CLIENT_ID
    await expect(refreshFitbitToken(TOKENS)).rejects.toThrow(FitbitAuthError)
  })
})

// =============================================
// fetchFitbitBodyLog
// =============================================

describe('fetchFitbitBodyLog', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns the first weight entry on success', async () => {
    vi.stubGlobal('fetch', mockFetch(200, BODY_LOG_RESPONSE))
    const result = await fetchFitbitBodyLog('2026-03-25', 'token')
    expect(result?.weight).toBe(85.2)
    expect(result?.bmi).toBe(27.5)
    expect(result?.fat).toBe(22.3)
  })

  it('returns null when weight array is empty', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { weight: [] }))
    const result = await fetchFitbitBodyLog('2026-03-25', 'token')
    expect(result).toBeNull()
  })

  it('returns null on non-auth error response', async () => {
    vi.stubGlobal('fetch', mockFetch(404, {}))
    const result = await fetchFitbitBodyLog('2026-03-25', 'token')
    expect(result).toBeNull()
  })

  it('throws FitbitAuthError on 401', async () => {
    vi.stubGlobal('fetch', mockFetch(401, {}))
    await expect(fetchFitbitBodyLog('2026-03-25', 'token')).rejects.toThrow(FitbitAuthError)
  })

  it('throws FitbitRateLimitError on 429', async () => {
    vi.stubGlobal('fetch', mockFetch(429, {}, { 'Retry-After': '900' }))
    await expect(fetchFitbitBodyLog('2026-03-25', 'token')).rejects.toThrow(FitbitRateLimitError)
  })

  it('sends Bearer token', async () => {
    const fetchMock = mockFetch(200, BODY_LOG_RESPONSE)
    vi.stubGlobal('fetch', fetchMock)
    await fetchFitbitBodyLog('2026-03-25', 'my-token')
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((options.headers as Record<string, string>)['Authorization']).toBe('Bearer my-token')
  })
})

// =============================================
// fetchFitbitActivitySummary
// =============================================

describe('fetchFitbitActivitySummary', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns summary on success', async () => {
    vi.stubGlobal('fetch', mockFetch(200, ACTIVITY_RESPONSE))
    const result = await fetchFitbitActivitySummary('2026-03-25', 'token')
    expect(result?.steps).toBe(11234)
    expect(result?.caloriesOut).toBe(2450)
    expect(result?.restingHeartRate).toBe(58)
    expect(result?.fairlyActiveMinutes).toBe(20)
    expect(result?.veryActiveMinutes).toBe(35)
  })

  it('returns null on error response', async () => {
    vi.stubGlobal('fetch', mockFetch(500, {}))
    const result = await fetchFitbitActivitySummary('2026-03-25', 'token')
    expect(result).toBeNull()
  })

  it('throws FitbitAuthError on 401', async () => {
    vi.stubGlobal('fetch', mockFetch(401, {}))
    await expect(fetchFitbitActivitySummary('2026-03-25', 'token')).rejects.toThrow(FitbitAuthError)
  })

  it('throws FitbitRateLimitError on 429', async () => {
    vi.stubGlobal('fetch', mockFetch(429, {}, { 'Retry-After': '60' }))
    await expect(fetchFitbitActivitySummary('2026-03-25', 'token')).rejects.toThrow(
      FitbitRateLimitError,
    )
  })
})

// =============================================
// syncFitbitDay
// =============================================

describe('syncFitbitDay', () => {
  afterEach(() => vi.unstubAllGlobals())

  function makePrismaMock() {
    const upsert = vi.fn().mockResolvedValue({})
    const prisma = { dailyMetrics: { upsert } } as unknown as PrismaClient
    return { prisma, upsert }
  }

  it('upserts parsed metrics into DB', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: { get: () => null },
          json: () => Promise.resolve(BODY_LOG_RESPONSE),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: { get: () => null },
          json: () => Promise.resolve(ACTIVITY_RESPONSE),
        }),
    )

    const { prisma: prismaMock, upsert } = makePrismaMock()
    const result = await syncFitbitDay('2026-03-25', TOKENS, prismaMock)

    expect(upsert).toHaveBeenCalledOnce()
    const call = upsert.mock.calls[0][0]
    expect(call.create.weight).toBe(85.2)
    expect(call.create.bodyFat).toBe(22.3)
    expect(call.create.bmi).toBe(27.5)
    expect(call.create.steps).toBeUndefined()
    expect(call.create.activeMinutes).toBe(55) // 20 + 35
    expect(call.create.caloriesBurned).toBe(2450)
    expect(call.create.distance).toBe(8.4)
    expect(call.create.restingHR).toBe(58)
    expect(call.create.source).toBe('FITBIT')

    expect(result.weight).toBe(85.2)
    expect(result.newTokens).toBeUndefined()
  })

  it('returns result with nulls when API returns no data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: { get: () => null },
          json: () => Promise.resolve({ weight: [] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: { get: () => null },
          json: () => Promise.resolve({}),
        }),
    )

    const { prisma: prismaMock, upsert } = makePrismaMock()
    const result = await syncFitbitDay('2026-03-25', TOKENS, prismaMock)

    expect(result.weight).toBeUndefined()
    expect(upsert).toHaveBeenCalledOnce()
  })

  it('refreshes token once on 401 and sets newTokens in result', async () => {
    process.env.FITBIT_CLIENT_ID = 'cid'
    process.env.FITBIT_CLIENT_SECRET = 'csecret'

    // Both concurrent requests get 401 → shared refresh runs once →
    // both retries use the new token.
    const fetchMock = vi.fn()
      // Body log → 401
      .mockResolvedValueOnce({
        ok: false, status: 401, headers: { get: () => null }, json: () => Promise.resolve({}),
      })
      // Activity summary → 401
      .mockResolvedValueOnce({
        ok: false, status: 401, headers: { get: () => null }, json: () => Promise.resolve({}),
      })
      // Token refresh (shared — called only once)
      .mockResolvedValueOnce({
        ok: true, status: 200, headers: { get: () => null },
        json: () => Promise.resolve({ access_token: 'new-access', refresh_token: 'new-refresh' }),
      })
      // Body log retry with new token
      .mockResolvedValueOnce({
        ok: true, status: 200, headers: { get: () => null },
        json: () => Promise.resolve(BODY_LOG_RESPONSE),
      })
      // Activity retry with new token
      .mockResolvedValueOnce({
        ok: true, status: 200, headers: { get: () => null },
        json: () => Promise.resolve(ACTIVITY_RESPONSE),
      })
    vi.stubGlobal('fetch', fetchMock)

    const { prisma: prismaMock } = makePrismaMock()
    const result = await syncFitbitDay('2026-03-25', TOKENS, prismaMock)

    expect(result.newTokens?.accessToken).toBe('new-access')
    expect(result.newTokens?.refreshToken).toBe('new-refresh')
    expect(result.weight).toBe(85.2)

    // Refresh endpoint was called exactly once despite two 401s
    const refreshCalls = fetchMock.mock.calls.filter(
      (args) => (args as unknown[])[0] === 'https://api.fitbit.com/oauth2/token',
    )
    expect(refreshCalls).toHaveLength(1)

    delete process.env.FITBIT_CLIENT_ID
    delete process.env.FITBIT_CLIENT_SECRET
    vi.unstubAllGlobals()
  })
})
