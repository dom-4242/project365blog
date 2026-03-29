export const dynamic = 'force-dynamic'

import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getDayNumber } from '@/lib/journal'
import { stripHtml } from '@/lib/site'

export interface SearchResult {
  slug: string
  title: string
  date: string
  excerpt: string
  dayNumber: number
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) {
    return Response.json({ results: [] })
  }

  const entries = await prisma.journalEntry.findMany({
    where: {
      published: true,
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { excerpt: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { slug: true, title: true, date: true, excerpt: true, content: true },
    orderBy: { date: 'desc' },
    take: 8,
  })

  const results: SearchResult[] = entries.map((e) => {
    const dateStr = e.date.toISOString().slice(0, 10)
    return {
      slug: e.slug,
      title: e.title,
      date: dateStr,
      excerpt: e.excerpt ?? stripHtml(e.content).slice(0, 120),
      dayNumber: getDayNumber(dateStr),
    }
  })

  return Response.json({ results })
}
