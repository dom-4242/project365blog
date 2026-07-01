import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { exchangeWithingsCode, WithingsAuthError } from '@/lib/withings'
import { saveWithingsTokens } from '@/lib/withings-tokens'

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://project365.dom42.ch'

  // Must be authenticated admin
  const token = await getToken({ req: request })
  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', baseUrl))
  }

  const code = request.nextUrl.searchParams.get('code')
  const error = request.nextUrl.searchParams.get('error')

  if (error || !code) {
    const adminUrl = new URL('/admin/withings', baseUrl)
    adminUrl.searchParams.set('error', error ?? 'missing_code')
    return NextResponse.redirect(adminUrl)
  }

  const redirectUri = new URL('/api/withings/callback', baseUrl).toString()

  try {
    const tokens = await exchangeWithingsCode(code, redirectUri)
    await saveWithingsTokens(tokens)
    console.log('[withings-callback] New tokens saved to DB.')
  } catch (err) {
    console.error('[withings-callback] Token exchange failed:', err)
    const adminUrl = new URL('/admin/withings', baseUrl)
    adminUrl.searchParams.set('error', err instanceof WithingsAuthError ? 'config_missing' : 'token_exchange_failed')
    return NextResponse.redirect(adminUrl)
  }

  const adminUrl = new URL('/admin/withings', baseUrl)
  adminUrl.searchParams.set('authorized', '1')
  return NextResponse.redirect(adminUrl)
}
