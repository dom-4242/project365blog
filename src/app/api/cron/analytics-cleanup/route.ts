import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Deletes raw PageView records older than 90 days.
// Run daily via cron (reuses CRON_SECRET).

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)

  const { count } = await prisma.pageView.deleteMany({
    where: { timestamp: { lt: cutoff } },
  })

  console.log(`[analytics-cleanup] Deleted ${count} PageView records older than 90 days`)

  return NextResponse.json({ ok: true, deleted: count })
}
