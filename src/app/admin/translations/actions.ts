'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export interface TranslationEditData {
  title: string
  excerpt: string
  content: string
  locale: 'en' | 'pt'
}

export interface ActionResult {
  error?: string
}

export async function updateTranslation(entryId: string, data: TranslationEditData): Promise<ActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  if (!data.title.trim()) return { error: 'Titel ist erforderlich' }
  if (!data.content.trim()) return { error: 'Inhalt ist erforderlich' }

  const entry = await prisma.journalEntry.findUnique({
    where: { id: entryId },
    select: { slug: true },
  })
  if (!entry) return { error: 'Eintrag nicht gefunden' }

  await prisma.translation.upsert({
    where: { entryId_locale: { entryId, locale: data.locale } },
    create: {
      entryId,
      locale: data.locale,
      title: data.title.trim(),
      excerpt: data.excerpt.trim(),
      content: data.content.trim(),
    },
    update: {
      title: data.title.trim(),
      excerpt: data.excerpt.trim(),
      content: data.content.trim(),
    },
  })

  revalidatePath('/admin/translations')
  revalidatePath(`/admin/translations/${entryId}`)
  revalidatePath(`/${data.locale}/journal/${entry.slug}`)

  return {}
}
