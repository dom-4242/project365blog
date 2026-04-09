/**
 * Simple in-memory fixed-window rate limiter.
 * Suitable for a single-instance self-hosted deployment.
 * State is lost on process restart — acceptable for this use case.
 */

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

// Clean up expired entries every minute to prevent unbounded memory growth
const CLEANUP_INTERVAL_MS = 60_000
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key)
    }
  }, CLEANUP_INTERVAL_MS).unref?.()
}

export interface RateLimitResult {
  success: boolean
  /** Remaining requests in the current window */
  remaining: number
  /** Milliseconds until the window resets */
  resetIn: number
}

/**
 * Check and increment the rate limit counter for a given key.
 *
 * @param key      Unique key, e.g. `"reactions:POST:<ipHash>"`
 * @param limit    Max requests allowed in the window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1, resetIn: windowMs }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetIn: entry.resetAt - now }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count, resetIn: entry.resetAt - now }
}

/** Extract the client IP from a Next.js request, accounting for reverse proxies. */
export function getClientIp(request: { headers: { get(name: string): string | null } }): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}
