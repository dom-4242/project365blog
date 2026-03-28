import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { EntryForm } from '@/components/admin/EntryForm'
import type { EntryFormData } from '@/app/admin/entries/actions'

interface EditEntryPageProps {
  params: { id: string }
}

export default async function EditEntryPage({ params }: EditEntryPageProps) {
  const entry = await prisma.journalEntry.findUnique({ where: { id: params.id } })
  if (!entry) notFound()

  const initial: EntryFormData = {
    title: entry.title,
    slug: entry.slug,
    date: entry.date.toISOString().slice(0, 10),
    content: entry.content,
    excerpt: entry.excerpt ?? '',
    movement: entry.movement,
    nutrition: entry.nutrition,
    smoking: entry.smoking,
    tags: entry.tags,
    published: entry.published,
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-[#1a1714] mb-8">Eintrag bearbeiten</h1>
      <EntryForm mode="edit" entryId={entry.id} initial={initial} />
    </div>
  )
}
