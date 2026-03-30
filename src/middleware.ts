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
  return intlMiddleware(req)
}

export const config = {
  matcher: [
    // Admin routes (auth protection)
    '/admin/:path*',
    // All public routes — exclude Next.js internals, API routes, and files with extensions
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}
