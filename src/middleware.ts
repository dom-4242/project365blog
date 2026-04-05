import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { routing } from '@/i18n/routing'

const intlMiddleware = createMiddleware(routing)

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Admin routes: NextAuth protection ──────────────────────────
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next()
    const token = await getToken({ req })
    if (!token) {
      const loginUrl = new URL('/admin/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // ── Public routes: next-intl locale routing ─────────────────────
  const response = intlMiddleware(req)

  // ── Analytics tracking (fire-and-forget) ─────────────────────────
  const isLocaleRoute = /^\/(de|en)(\/|$)/.test(pathname)
  const internalSecret = process.env.INTERNAL_SECRET
  if (isLocaleRoute && internalSecret) {
    const ua = req.headers.get('user-agent') ?? ''
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      '0.0.0.0'
    const referrer = req.headers.get('referer') ?? ''
    void fetch(new URL('/api/internal/track', req.url).toString(), {
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
