'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { translateEntry as translateEntryViaAI } from '@/lib/translate'
import { MovementLevel, NutritionLevel, SmokingStatus } from '@prisma/client'

export interface EntryFormData {
  title: string
  slug: string
  date: string // YYYY-MM-DD
  content: string
  excerpt: string
  bannerUrl?: string
  movement: MovementLevel
  nutrition: NutritionLevel
  smoking: SmokingStatus
  tags: string[]
  published: boolean
  privateNotes?: string
}

export interface ActionResult {
  error?: string
  slug?: string
}

function extractExcerpt(html: string, maxLength = 160): string {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > maxLength ? text.slice(0, maxLength).trimEnd() + '…' : text
}

export async function createEntry(data: EntryFormData): Promise<ActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  if (!data.title.trim()) return { error: 'Titel ist erforderlich' }
  if (!data.slug.trim()) return { error: 'Slug ist erforderlich' }
  if (!data.date) return { error: 'Datum ist erforderlich' }
  if (!data.content || data.content === '<p></p>') return { error: 'Inhalt ist erforderlich' }

  const existing = await prisma.journalEntry.findUnique({ where: { slug: data.slug } })
  if (existing) return { error: `Slug „${data.slug}" ist bereits vergeben` }

  try {
    await prisma.journalEntry.create({
      data: {
        title: data.title.trim(),
        slug: data.slug.trim(),
        date: new Date(data.date),
        content: data.content,
        excerpt: data.excerpt.trim() || extractExcerpt(data.content),
        bannerUrl: data.bannerUrl ?? null,
        movement: data.movement,
        nutrition: data.nutrition,
        smoking: data.smoking,
        tags: data.tags,
        published: data.published,
        privateNotes: data.privateNotes?.trim() || null,
      },
    })

    revalidatePath('/')
    revalidatePath('/admin/entries')
    revalidatePath(`/de/journal/${data.slug}`)

    return { slug: data.slug }
  } catch (e) {
    console.error('createEntry:', e)
    return { error: 'Fehler beim Speichern' }
  }
}

export async function updateEntry(id: string, data: EntryFormData): Promise<ActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  if (!data.title.trim()) return { error: 'Titel ist erforderlich' }
  if (!data.content || data.content === '<p></p>') return { error: 'Inhalt ist erforderlich' }

  try {
    const entry = await prisma.journalEntry.update({
      where: { id },
      data: {
        title: data.title.trim(),
        date: new Date(data.date),
        content: data.content,
        excerpt: data.excerpt.trim() || extractExcerpt(data.content),
        bannerUrl: data.bannerUrl ?? null,
        movement: data.movement,
        nutrition: data.nutrition,
        smoking: data.smoking,
        tags: data.tags,
        published: data.published,
        privateNotes: data.privateNotes?.trim() || null,
      },
    })

    revalidatePath('/')
    revalidatePath('/admin/entries')
    revalidatePath('/admin/translations')
    revalidatePath(`/de/journal/${entry.slug}`)
    revalidatePath(`/en/journal/${entry.slug}`)

    return { slug: entry.slug }
  } catch (e) {
    console.error('updateEntry:', e)
    return { error: 'Fehler beim Speichern' }
  }
}

export async function deleteEntry(id: string): Promise<ActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  try {
    await prisma.journalEntry.delete({ where: { id } })
    revalidatePath('/')
    revalidatePath('/admin/entries')
    return {}
  } catch (e) {
    console.error('deleteEntry:', e)
    return { error: 'Fehler beim Löschen' }
  }
}

export async function translateEntry(id: string, locale: 'en' | 'pt' = 'en'): Promise<ActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: 'ANTHROPIC_API_KEY nicht konfiguriert' }
  }

  const entry = await prisma.journalEntry.findUnique({ where: { id } })
  if (!entry) return { error: 'Eintrag nicht gefunden' }

  try {
    const translated = await translateEntryViaAI({
      title: entry.title,
      content: entry.content,
      excerpt: entry.excerpt,
    }, locale)

    await prisma.translation.upsert({
      where: { entryId_locale: { entryId: id, locale } },
      create: {
        entryId: id,
        locale,
        title: translated.title,
        content: translated.content,
        excerpt: translated.excerpt,
      },
      update: {
        title: translated.title,
        content: translated.content,
        excerpt: translated.excerpt,
        updatedAt: new Date(),
      },
    })

    revalidatePath('/admin/entries')
    revalidatePath(`/${locale}/journal/${entry.slug}`)

    return {}
  } catch (e) {
    console.error('translateEntry:', e)
    const message = e instanceof Error ? e.message : 'Übersetzung fehlgeschlagen'
    return { error: message }
  }
}
