import { MovementLevel, NutritionLevel, SmokingStatus } from '@prisma/client'
import type { JournalEntry as PrismaJournalEntry } from '@prisma/client'
import { prisma } from './db'

/** @deprecated Use getProjectStartDate() from lib/project-config instead */
export const PROJECT_START_DATE = '2026-03-26'
const PROJECT_START = new Date('2026-03-26')

// =============================================
// Types — öffentliche Schnittstelle (unverändert für Komponenten)
// =============================================

export type MovementValue = 'minimal' | 'steps_only' | 'trained_only' | 'steps_trained'
export type NutritionValue = 'none' | 'one_meal' | 'two_meals' | 'three_meals'
export type SmokingValue = 'smoked' | 'nicotine_replacement' | 'smoke_free'

export interface HabitsFrontmatter {
  movement: MovementValue
  nutrition: NutritionValue
  smoking: SmokingValue
}

export interface JournalEntry {
  id: string
  slug: string
  title: string
  date: string // YYYY-MM-DD
  banner?: string
  tags?: string[]
  habits: HabitsFrontmatter
  content: string
  excerpt?: string
  sweetsConsumed?: boolean | null
}

export type JournalEntryMeta = Omit<JournalEntry, 'content'>

// =============================================
// Enum-Mapping: Prisma → Lowercase-String
// =============================================

const MOVEMENT_TO_VALUE: Record<MovementLevel, MovementValue> = {
  MINIMAL: 'minimal',
  STEPS_ONLY: 'steps_only',
  TRAINED_ONLY: 'trained_only',
  STEPS_TRAINED: 'steps_trained',
}

const NUTRITION_TO_VALUE: Record<NutritionLevel, NutritionValue> = {
  NONE: 'none',
  ONE_MEAL: 'one_meal',
  TWO_MEALS: 'two_meals',
  THREE_MEALS: 'three_meals',
}

const SMOKING_TO_VALUE: Record<SmokingStatus, SmokingValue> = {
  SMOKED: 'smoked',
  NICOTINE_REPLACEMENT: 'nicotine_replacement',
  SMOKE_FREE: 'smoke_free',
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function toMeta(entry: PrismaJournalEntry): JournalEntryMeta {
  return {
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    date: toDateString(entry.date),
    banner: entry.bannerUrl ?? undefined,
    tags: entry.tags.length > 0 ? entry.tags : undefined,
    excerpt: entry.excerpt ?? undefined,
    habits: {
      movement: MOVEMENT_TO_VALUE[entry.movement],
      nutrition: NUTRITION_TO_VALUE[entry.nutrition],
      smoking: SMOKING_TO_VALUE[entry.smoking],
    },
    sweetsConsumed: entry.sweetsConsumed,
  }
}

function toFull(entry: PrismaJournalEntry): JournalEntry {
  return {
    ...toMeta(entry),
    content: entry.content,
  }
}

// =============================================
// DB-Queries (ersetzen Filesystem-Reads)
// =============================================

export async function getAllEntries(): Promise<JournalEntryMeta[]> {
  const entries = await prisma.journalEntry.findMany({
    where: { published: true },
    orderBy: { date: 'desc' },
  })
  return entries.map(toMeta)
}

export async function getAllEntriesForLocale(locale: string): Promise<JournalEntryMeta[]> {
  if (locale === 'de') return getAllEntries()

  const entries = await prisma.journalEntry.findMany({
    where: { published: true },
    orderBy: { date: 'desc' },
    include: { translations: { where: { locale } } },
  })

  return entries.map((entry) => {
    const meta = toMeta(entry)
    const translation = entry.translations[0] ?? null
    if (translation) {
      meta.title = translation.title
      if (translation.excerpt) meta.excerpt = translation.excerpt
    }
    return meta
  })
}

export async function getEntryBySlug(slug: string): Promise<JournalEntry | null> {
  const entry = await prisma.journalEntry.findUnique({ where: { slug } })
  if (!entry || !entry.published) return null
  return toFull(entry)
}

export async function getEntryBySlugWithTranslation(
  slug: string,
  locale: string,
): Promise<{ entry: JournalEntry; translation: { title: string; content: string; excerpt: string } | null } | null> {
  const row = await prisma.journalEntry.findUnique({
    where: { slug },
    include: { translations: { where: { locale } } },
  })
  if (!row || !row.published) return null

  const entry = toFull(row)
  const t = row.translations[0] ?? null
  const translation = t
    ? { title: t.title, content: t.content, excerpt: t.excerpt ?? '' }
    : null

  return { entry, translation }
}

// =============================================
// Helpers
// =============================================

/**
 * Extrahiert einen Plaintext-Excerpt aus Markdown/HTML-Content.
 * Nimmt den ersten nicht-leeren, nicht-Überschriften-Absatz (max 160 Zeichen).
 */
export function getExcerpt(content: string, maxLength = 160): string {
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (
      !trimmed ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('<') ||
      trimmed.startsWith('import ') ||
      trimmed.startsWith('export ')
    )
      continue
    const plain = trimmed
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    if (plain.length < 10) continue
    return plain.length > maxLength ? plain.slice(0, maxLength).trimEnd() + '…' : plain
  }
  return ''
}

/**
 * Gibt die Projekttagnummer für ein Datums-String zurück (YYYY-MM-DD).
 * @param date - Datum des Eintrags (YYYY-MM-DD)
 * @param startDate - Projekt-Startdatum (YYYY-MM-DD). Default: hardcodierter Fallback.
 */
export function getDayNumber(date: string, startDate?: string): number {
  const start = startDate ? new Date(startDate) : PROJECT_START
  const ms = new Date(date).getTime() - start.getTime()
  return Math.floor(ms / 86_400_000) + 1
}
