import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { EntryForm } from '@/components/admin/EntryForm'
import type { EntryFormData } from '@/app/admin/entries/actions'
import { getMealLog } from '@/lib/meal-log'

interface EditEntryPageProps {
  params: { id: string }
}

export default async function EditEntryPage({ params }: EditEntryPageProps) {
  const entry = await prisma.journalEntry.findUnique({ where: { id: params.id } })
  if (!entry) notFound()

  const dateStr = entry.date.toISOString().slice(0, 10)
  const mealLog = await getMealLog(dateStr)

  const initial: EntryFormData = {
    title: entry.title,
    slug: entry.slug,
    date: entry.date.toISOString().slice(0, 10),
    content: entry.content,
    excerpt: entry.excerpt ?? '',
    bannerUrl: entry.bannerUrl ?? undefined,
    movement: entry.movement,
    nutrition: entry.nutrition,
    smoking: entry.smoking,
    tags: entry.tags,
    published: entry.published,
    privateNotes: entry.privateNotes ?? '',
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-headline text-2xl font-bold text-on-surface mb-8">Eintrag bearbeiten</h1>
      <EntryForm mode="edit" entryId={entry.id} initial={initial} mealLog={mealLog} />
    </div>
  )
}
