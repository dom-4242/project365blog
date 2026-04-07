import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isBot, hashSession, normalizePath, extractDomain } from '@/lib/analytics'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-internal-secret')
  if (!process.env.INTERNAL_SECRET || secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { path: string; referrer?: string; ua: string; ip: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { path, referrer, ua, ip } = body

  if (isBot(ua)) {
    return NextResponse.json({ ok: true, skipped: 'bot' })
  }

  const salt = process.env.ANALYTICS_SALT
  if (!salt) {
    console.warn('[track] ANALYTICS_SALT not set — pageview tracking skipped')
    return NextResponse.json({ ok: true, skipped: 'no-salt' })
  }
  const date = new Date().toISOString().slice(0, 10)
  const sessionHash = hashSession(ip, ua, date, salt)
  const normalizedPath = normalizePath(path)
  const referrerDomain = referrer ? extractDomain(referrer) : null

  await prisma.pageView.create({
    data: {
      path: normalizedPath,
      referrer: referrerDomain,
      sessionHash,
    },
  })

  return NextResponse.json({ ok: true })
}
