import { prisma } from '@/lib/db'
import { ReadingPanel } from '@/components/admin/ReadingPanel'

export const dynamic = 'force-dynamic'

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

export default async function ReadingPage() {
  const today = todayString()

  const [booksRaw, recentLogsRaw] = await Promise.all([
    prisma.book.findMany({
      orderBy: [{ completed: 'asc' }, { createdAt: 'desc' }],
      include: {
        readingLogs: { select: { pagesRead: true } },
      },
    }),
    prisma.readingLog.findMany({
      orderBy: { date: 'desc' },
      take: 14,
      include: { book: { select: { title: true } } },
    }),
  ])

  const books = booksRaw.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    totalPages: b.totalPages,
    startDate: b.startDate?.toISOString().slice(0, 10) ?? null,
    endDate: b.endDate?.toISOString().slice(0, 10) ?? null,
    completed: b.completed,
    pagesLogged: b.readingLogs.reduce((sum, l) => sum + l.pagesRead, 0),
  }))

  const recentLogs = recentLogsRaw.map((l) => ({
    id: l.id,
    date: l.date.toISOString().slice(0, 10),
    pagesRead: l.pagesRead,
    bookTitle: l.book.title,
  }))

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">Lesen</h1>
        <p className="text-on-surface-variant text-sm">Bücher verwalten und gelesene Seiten erfassen</p>
      </div>
      <ReadingPanel books={books} todayDate={today} recentLogs={recentLogs} />
    </div>
  )
}
