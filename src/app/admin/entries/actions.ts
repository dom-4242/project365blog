'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { translateEntry as translateEntryViaAI } from '@/lib/translate'
import { generateDailyQuote as generateDailyQuoteAI, type DailyQuoteContext } from '@/lib/daily-quote'
import { getDayNumber } from '@/lib/journal'
import { getProjectStartDate } from '@/lib/project-config'
import { MovementLevel, NutritionLevel, SmokingStatus, EntryType } from '@prisma/client'

export interface EntryFormData {
  title: string
  slug: string
  date: string // YYYY-MM-DD
  content: string
  excerpt: string
  bannerUrl?: string
  entryType: EntryType
  movement: MovementLevel
  nutrition: NutritionLevel
  smoking: SmokingStatus
  tags: string[]
  published: boolean
  privateNotes?: string
  dailyQuote?: string
}

export interface ActionResult {
  error?: string
  slug?: string
}

function fillerTitleForDate(dateStr: string): string {
  const formatted = new Date(dateStr).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Tagesnotiz – ${formatted}`
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

  if (!data.slug.trim()) return { error: 'Slug ist erforderlich' }
  if (!data.date) return { error: 'Datum ist erforderlich' }
  const isFiller = data.entryType === 'FILLER'
  if (!isFiller) {
    if (!data.title.trim()) return { error: 'Titel ist erforderlich' }
    if (!data.content || data.content === '<p></p>') return { error: 'Inhalt ist erforderlich' }
  }

  const existing = await prisma.journalEntry.findUnique({ where: { slug: data.slug } })
  if (existing) return { error: `Slug „${data.slug}" ist bereits vergeben` }

  try {
    await prisma.journalEntry.create({
      data: {
        title: isFiller ? fillerTitleForDate(data.date) : data.title.trim(),
        slug: data.slug.trim(),
        date: new Date(data.date),
        content: isFiller ? '' : data.content,
        excerpt: isFiller
          ? data.excerpt.trim() || null
          : data.excerpt.trim() || extractExcerpt(data.content),
        bannerUrl: data.bannerUrl ?? null,
        entryType: data.entryType,
        movement: data.movement,
        nutrition: data.nutrition,
        smoking: data.smoking,
        tags: isFiller ? [] : data.tags,
        published: data.published,
        privateNotes: data.privateNotes?.trim() || null,
        dailyQuote: data.dailyQuote?.trim() || null,
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

  const isFiller = data.entryType === 'FILLER'
  if (!isFiller) {
    if (!data.title.trim()) return { error: 'Titel ist erforderlich' }
    if (!data.content || data.content === '<p></p>') return { error: 'Inhalt ist erforderlich' }
  }

  try {
    const entry = await prisma.journalEntry.update({
      where: { id },
      data: {
        title: isFiller ? fillerTitleForDate(data.date) : data.title.trim(),
        date: new Date(data.date),
        content: isFiller ? '' : data.content,
        excerpt: isFiller
          ? data.excerpt.trim() || null
          : data.excerpt.trim() || extractExcerpt(data.content),
        bannerUrl: data.bannerUrl ?? null,
        entryType: data.entryType,
        movement: data.movement,
        nutrition: data.nutrition,
        smoking: data.smoking,
        tags: isFiller ? [] : data.tags,
        published: data.published,
        privateNotes: data.privateNotes?.trim() || null,
        dailyQuote: data.dailyQuote?.trim() || null,
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

export interface QuoteContextInput {
  date: string // YYYY-MM-DD
  movement: MovementLevel
  nutrition: NutritionLevel
  smoking: SmokingStatus
}

export interface QuoteResult {
  quote?: string
  error?: string
}

const MOVEMENT_LABELS: Record<MovementLevel, string> = {
  MINIMAL: 'unter 10k Schritten, kein Training',
  STEPS_ONLY: '10k+ Schritte, kein Training',
  TRAINED_ONLY: 'Training absolviert, unter 10k Schritte',
  STEPS_TRAINED: '10k+ Schritte und Training',
}

const NUTRITION_LABELS: Record<NutritionLevel, string> = {
  NONE: 'keine Mahlzeit erfasst',
  ONE_MEAL: '1 Mahlzeit',
  TWO_MEALS: '2 Mahlzeiten',
  THREE_MEALS: '3 Mahlzeiten',
}

const SMOKING_LABELS: Record<SmokingStatus, string> = {
  SMOKED: 'geraucht',
  NICOTINE_REPLACEMENT: 'Nikotinersatz statt Zigarette',
  SMOKE_FREE: 'rauchfrei ohne Hilfsmittel',
}

export async function generateQuoteForEntry(input: QuoteContextInput): Promise<QuoteResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: 'ANTHROPIC_API_KEY nicht konfiguriert' }
  }

  try {
    const date = new Date(input.date)
    const [metrics, mealLog, startDate] = await Promise.all([
      prisma.dailyMetrics.findUnique({
        where: { date },
        select: { steps: true, weight: true, bodyFat: true },
      }),
      prisma.mealLog.findUnique({ where: { date }, select: { score: true } }),
      getProjectStartDate(),
    ])

    const ctx: DailyQuoteContext = {
      date: input.date,
      dayNumber: getDayNumber(input.date, startDate),
      movement: MOVEMENT_LABELS[input.movement],
      nutrition: NUTRITION_LABELS[input.nutrition],
      smoking: SMOKING_LABELS[input.smoking],
      steps: metrics?.steps,
      weightKg: metrics?.weight,
      bodyFatPct: metrics?.bodyFat,
      mealScore: mealLog?.score,
    }

    const quote = await generateDailyQuoteAI(ctx)
    return { quote }
  } catch (e) {
    console.error('generateQuoteForEntry:', e)
    const message = e instanceof Error ? e.message : 'Generierung fehlgeschlagen'
    return { error: message }
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
  if (entry.entryType === 'FILLER') {
    return { error: 'Tagesnotizen werden nicht übersetzt' }
  }

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
