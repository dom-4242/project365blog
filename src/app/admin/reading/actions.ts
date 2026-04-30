'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// ── Books ──────────────────────────────────────────────

export async function saveBook(data: {
  id?: string
  title: string
  author: string
  totalPages: string
  startDate: string
  endDate: string
  completed: boolean
}): Promise<{ error?: string; id?: string }> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }
  if (!data.title.trim()) return { error: 'Titel erforderlich' }

  const resolvedEndDate = data.endDate
    ? new Date(data.endDate)
    : data.completed
      ? new Date()
      : null

  const row = {
    title:      data.title.trim(),
    author:     data.author.trim() || null,
    totalPages: data.totalPages ? parseInt(data.totalPages) : null,
    startDate:  data.startDate ? new Date(data.startDate) : null,
    endDate:    resolvedEndDate,
    completed:  data.completed,
  }

  if (data.id) {
    await prisma.book.update({ where: { id: data.id }, data: row })
  } else {
    await prisma.book.create({ data: row })
  }

  revalidatePath('/admin/reading')
  revalidatePath('/')
  revalidatePath('/de')
  revalidatePath('/en')
  revalidatePath('/de/metrics')
  revalidatePath('/en/metrics')
  return { id: data.id ?? '' }
}

export async function deleteBook(id: string): Promise<{ error?: string }> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }
  await prisma.book.delete({ where: { id } })
  revalidatePath('/admin/reading')
  return {}
}

// ── Reading Log ────────────────────────────────────────

export async function logPages(data: {
  date: string
  bookId: string
  pagesRead: string
}): Promise<{ error?: string }> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  const pages = parseInt(data.pagesRead)
  if (!pages || pages < 1) return { error: 'Ungültige Seitenanzahl' }
  if (!data.bookId) return { error: 'Kein Buch gewählt' }

  await prisma.readingLog.upsert({
    where: { date_bookId: { date: new Date(data.date), bookId: data.bookId } },
    create: { date: new Date(data.date), bookId: data.bookId, pagesRead: pages },
    update: { pagesRead: pages },
  })

  revalidatePath('/admin/reading')
  revalidatePath('/de/metrics')
  revalidatePath('/en/metrics')
  return {}
}

export async function deleteLog(id: string): Promise<{ error?: string }> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }
  await prisma.readingLog.delete({ where: { id } })
  revalidatePath('/admin/reading')
  return {}
}
