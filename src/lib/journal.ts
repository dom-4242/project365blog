import { MovementLevel, NutritionLevel, SmokingStatus } from '@prisma/client'
import type { JournalEntry as PrismaJournalEntry } from '@prisma/client'
import { prisma } from './db'

export const PROJECT_START_DATE = '2026-03-26'
const PROJECT_START = new Date('2026-03-26')

// =============================================
// Types — öffentliche Schnittstelle (unverändert für Komponenten)
// =============================================

export type MovementValue = 'minimal' | 'steps_only' | 'steps_trained'
export type NutritionValue = 'none' | 'one' | 'two' | 'three'
export type SmokingValue = 'smoked' | 'replacement' | 'none'

export interface HabitsFrontmatter {
  movement: MovementValue
  nutrition: NutritionValue
  smoking: SmokingValue
}

export interface JournalEntry {
  slug: string
  title: string
  date: string // YYYY-MM-DD
  banner?: string
  tags?: string[]
  habits: HabitsFrontmatter
  content: string
  excerpt?: string
}

export type JournalEntryMeta = Omit<JournalEntry, 'content'>

// =============================================
// Enum-Mapping: Prisma → Lowercase-String
// =============================================

const MOVEMENT_TO_VALUE: Record<MovementLevel, MovementValue> = {
  MINIMAL: 'minimal',
  STEPS_ONLY: 'steps_only',
  STEPS_TRAINED: 'steps_trained',
}

const NUTRITION_TO_VALUE: Record<NutritionLevel, NutritionValue> = {
  NONE: 'none',
  ONE: 'one',
  TWO: 'two',
  THREE: 'three',
}

const SMOKING_TO_VALUE: Record<SmokingStatus, SmokingValue> = {
  SMOKED: 'smoked',
  REPLACEMENT: 'replacement',
  NONE: 'none',
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function toMeta(entry: PrismaJournalEntry): JournalEntryMeta {
  return {
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

export async function getEntryBySlug(slug: string): Promise<JournalEntry | null> {
  const entry = await prisma.journalEntry.findUnique({
    where: { slug },
  })
  if (!entry || !entry.published) return null
  return toFull(entry)
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
 * Tag 1 = 2026-03-26.
 */
export function getDayNumber(date: string): number {
  const ms = new Date(date).getTime() - PROJECT_START.getTime()
  return Math.floor(ms / 86_400_000) + 1
}
