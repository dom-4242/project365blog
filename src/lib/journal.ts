import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const JOURNAL_DIR = path.join(process.cwd(), 'content/journal')

// =============================================
// Types & Interfaces
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
  date: string
  banner?: string
  tags?: string[]
  habits: HabitsFrontmatter
  content: string
}

export type JournalEntryMeta = Omit<JournalEntry, 'content'>

// =============================================
// Validation
// =============================================

const VALID_MOVEMENT: ReadonlySet<string> = new Set(['minimal', 'steps_only', 'steps_trained'])
const VALID_NUTRITION: ReadonlySet<string> = new Set(['none', 'one', 'two', 'three'])
const VALID_SMOKING: ReadonlySet<string> = new Set(['smoked', 'replacement', 'none'])

export class FrontmatterValidationError extends Error {
  constructor(
    public readonly slug: string,
    message: string,
  ) {
    super(`[${slug}] ${message}`)
    this.name = 'FrontmatterValidationError'
  }
}

export function validateFrontmatter(
  slug: string,
  data: Record<string, unknown>,
): JournalEntryMeta {
  if (!data.title || typeof data.title !== 'string') {
    throw new FrontmatterValidationError(slug, 'Missing or invalid "title"')
  }
  if (!data.date || typeof data.date !== 'string') {
    throw new FrontmatterValidationError(slug, 'Missing or invalid "date"')
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    throw new FrontmatterValidationError(slug, `"date" must be YYYY-MM-DD, got "${data.date}"`)
  }
  if (data.banner !== undefined && typeof data.banner !== 'string') {
    throw new FrontmatterValidationError(slug, '"banner" must be a string')
  }
  if (data.tags !== undefined && !Array.isArray(data.tags)) {
    throw new FrontmatterValidationError(slug, '"tags" must be an array')
  }

  // Validate habits
  if (!data.habits || typeof data.habits !== 'object' || Array.isArray(data.habits)) {
    throw new FrontmatterValidationError(slug, 'Missing or invalid "habits" block')
  }

  const habits = data.habits as Record<string, unknown>

  if (!habits.movement || !VALID_MOVEMENT.has(String(habits.movement))) {
    throw new FrontmatterValidationError(
      slug,
      `"habits.movement" must be one of: ${[...VALID_MOVEMENT].join(', ')}`,
    )
  }
  if (!habits.nutrition || !VALID_NUTRITION.has(String(habits.nutrition))) {
    throw new FrontmatterValidationError(
      slug,
      `"habits.nutrition" must be one of: ${[...VALID_NUTRITION].join(', ')}`,
    )
  }
  if (!habits.smoking || !VALID_SMOKING.has(String(habits.smoking))) {
    throw new FrontmatterValidationError(
      slug,
      `"habits.smoking" must be one of: ${[...VALID_SMOKING].join(', ')}`,
    )
  }

  return {
    slug,
    title: data.title,
    date: data.date,
    banner: data.banner,
    tags: data.tags as string[] | undefined,
    habits: {
      movement: habits.movement as MovementValue,
      nutrition: habits.nutrition as NutritionValue,
      smoking: habits.smoking as SmokingValue,
    },
  }
}

// =============================================
// Readers
// =============================================

export function getAllEntries(): JournalEntryMeta[] {
  if (!fs.existsSync(JOURNAL_DIR)) return []

  const files = fs.readdirSync(JOURNAL_DIR).filter((f) => f.endsWith('.mdx'))

  const entries = files.map((filename) => {
    const slug = filename.replace('.mdx', '')
    const filePath = path.join(JOURNAL_DIR, filename)
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const { data } = matter(fileContent)
    return validateFrontmatter(slug, data as Record<string, unknown>)
  })

  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getEntryBySlug(slug: string): JournalEntry | null {
  const filePath = path.join(JOURNAL_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null

  const fileContent = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContent)
  const meta = validateFrontmatter(slug, data as Record<string, unknown>)

  return { ...meta, content }
}
