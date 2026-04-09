import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { saveFitbitTokens } from '@/lib/fitbit-tokens'

export async function GET(request: NextRequest) {
  // Must be authenticated admin
  const token = await getToken({ req: request })
  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  const code = request.nextUrl.searchParams.get('code')
  const error = request.nextUrl.searchParams.get('error')

  if (error || !code) {
    const adminUrl = new URL('/admin/fitbit', request.url)
    adminUrl.searchParams.set('error', error ?? 'missing_code')
    return NextResponse.redirect(adminUrl)
  }

  const clientId = process.env.FITBIT_CLIENT_ID
  const clientSecret = process.env.FITBIT_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Fitbit credentials not configured' }, { status: 500 })
  }

  const redirectUri = new URL('/api/fitbit/callback', request.url).toString()
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error('[fitbit-callback] Token exchange failed:', response.status, body)
    const adminUrl = new URL('/admin/fitbit', request.url)
    adminUrl.searchParams.set('error', 'token_exchange_failed')
    return NextResponse.redirect(adminUrl)
  }

  const data = (await response.json()) as { access_token: string; refresh_token: string }
  await saveFitbitTokens({ accessToken: data.access_token, refreshToken: data.refresh_token })

  console.log('[fitbit-callback] New tokens saved to DB.')

  const adminUrl = new URL('/admin/fitbit', request.url)
  adminUrl.searchParams.set('authorized', '1')
  return NextResponse.redirect(adminUrl)
}
