import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { routing } from '@/i18n/routing'

const intlMiddleware = createMiddleware(routing)

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development'
  const directives = [
    `default-src 'self'`,
    `script-src 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline'`,
    // Google avatar images in admin layout use lh3.googleusercontent.com
    `img-src 'self' data: blob: https://*.googleusercontent.com`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `media-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    ...(isDev ? [] : [`upgrade-insecure-requests`]),
  ]
  return directives.join('; ')
}

/** Return a NextResponse.next() with the nonce forwarded in request headers. */
function nextWithNonce(nonce: string, csp: string): NextResponse {
  const requestHeaders = new Headers()
  requestHeaders.set('x-nonce', nonce)
  const res = NextResponse.next({ request: { headers: requestHeaders } })
  res.headers.set('Content-Security-Policy', csp)
  return res
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildCsp(nonce)

  // ── Admin routes: NextAuth protection ──────────────────────────
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      return nextWithNonce(nonce, csp)
    }
    const token = await getToken({ req })
    if (!token) {
      const loginUrl = new URL('/admin/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return nextWithNonce(nonce, csp)
  }

  // ── Public routes: next-intl locale routing ─────────────────────
  const intlResponse = intlMiddleware(req)

  // Redirects don't render HTML — just forward the CSP header and return
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    intlResponse.headers.set('Content-Security-Policy', csp)
    return intlResponse
  }

  // For non-redirect responses: forward nonce to server components, preserve
  // any headers set by intl (e.g. locale cookie).
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  intlResponse.headers.forEach((value, key) => {
    response.headers.set(key, value)
  })
  response.headers.set('Content-Security-Policy', csp)

  // ── Analytics tracking (fire-and-forget) ─────────────────────────
  const isLocaleRoute = /^\/(de|en|pt)(\/|$)/.test(pathname)
  const internalSecret = process.env.INTERNAL_SECRET
  if (isLocaleRoute && internalSecret) {
    const ua = req.headers.get('user-agent') ?? ''
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      '0.0.0.0'
    const referrer = req.headers.get('referer') ?? ''
    await fetch(new URL('/api/internal/track', req.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': internalSecret },
      body: JSON.stringify({ path: pathname, referrer, ua, ip }),
    }).catch(() => undefined)
  }

  return response
}

export const config = {
  matcher: [
    // Admin routes (auth protection)
    '/admin/:path*',
    // All public routes — exclude Next.js internals, API routes, and files with extensions
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}
