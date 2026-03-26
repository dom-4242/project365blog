import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  validateFrontmatter,
  getAllEntries,
  getEntryBySlug,
  getExcerpt,
  getDayNumber,
  FrontmatterValidationError,
} from './journal'

// =============================================
// validateFrontmatter
// =============================================

describe('validateFrontmatter', () => {
  const validData = {
    title: 'Tag 1 — Der Anfang',
    date: '2026-03-26',
    habits: {
      movement: 'steps_only',
      nutrition: 'two',
      smoking: 'none',
    },
  }

  it('parses a valid frontmatter object', () => {
    const result = validateFrontmatter('2026-03-26', validData)
    expect(result.slug).toBe('2026-03-26')
    expect(result.title).toBe('Tag 1 — Der Anfang')
    expect(result.date).toBe('2026-03-26')
    expect(result.habits.movement).toBe('steps_only')
    expect(result.habits.nutrition).toBe('two')
    expect(result.habits.smoking).toBe('none')
  })

  it('includes optional banner and tags when present', () => {
    const data = {
      ...validData,
      banner: '/images/journal/2026-03-26.jpg',
      tags: ['start', 'motivation'],
    }
    const result = validateFrontmatter('2026-03-26', data)
    expect(result.banner).toBe('/images/journal/2026-03-26.jpg')
    expect(result.tags).toEqual(['start', 'motivation'])
  })

  it('accepts undefined banner and tags', () => {
    const result = validateFrontmatter('2026-03-26', validData)
    expect(result.banner).toBeUndefined()
    expect(result.tags).toBeUndefined()
  })

  it('throws when title is missing', () => {
    const data = { ...validData, title: undefined }
    expect(() => validateFrontmatter('2026-03-26', data)).toThrow(FrontmatterValidationError)
    expect(() => validateFrontmatter('2026-03-26', data)).toThrow('title')
  })

  it('throws when date is missing', () => {
    const data = { ...validData, date: undefined }
    expect(() => validateFrontmatter('2026-03-26', data)).toThrow(FrontmatterValidationError)
  })

  it('throws when date format is wrong', () => {
    const data = { ...validData, date: '26.03.2026' }
    expect(() => validateFrontmatter('2026-03-26', data)).toThrow('YYYY-MM-DD')
  })

  it('throws when habits block is missing', () => {
    const { habits: _, ...data } = validData
    expect(() => validateFrontmatter('2026-03-26', data)).toThrow('habits')
  })

  it('throws on invalid movement value', () => {
    const data = { ...validData, habits: { ...validData.habits, movement: 'ran_a_marathon' } }
    expect(() => validateFrontmatter('2026-03-26', data)).toThrow('habits.movement')
  })

  it('throws on invalid nutrition value', () => {
    const data = { ...validData, habits: { ...validData.habits, nutrition: 'five' } }
    expect(() => validateFrontmatter('2026-03-26', data)).toThrow('habits.nutrition')
  })

  it('throws on invalid smoking value', () => {
    const data = { ...validData, habits: { ...validData.habits, smoking: 'occasionally' } }
    expect(() => validateFrontmatter('2026-03-26', data)).toThrow('habits.smoking')
  })

  it('includes slug in error message', () => {
    const data = { ...validData, title: undefined }
    expect(() => validateFrontmatter('2026-03-26', data)).toThrow('[2026-03-26]')
  })

  it('accepts all valid movement values', () => {
    for (const movement of ['minimal', 'steps_only', 'steps_trained'] as const) {
      const data = { ...validData, habits: { ...validData.habits, movement } }
      expect(() => validateFrontmatter('2026-03-26', data)).not.toThrow()
    }
  })

  it('accepts all valid nutrition values', () => {
    for (const nutrition of ['none', 'one', 'two', 'three'] as const) {
      const data = { ...validData, habits: { ...validData.habits, nutrition } }
      expect(() => validateFrontmatter('2026-03-26', data)).not.toThrow()
    }
  })

  it('accepts all valid smoking values', () => {
    for (const smoking of ['smoked', 'replacement', 'none'] as const) {
      const data = { ...validData, habits: { ...validData.habits, smoking } }
      expect(() => validateFrontmatter('2026-03-26', data)).not.toThrow()
    }
  })
})

// =============================================
// getAllEntries / getEntryBySlug — filesystem tests
// =============================================

const FIXTURE_DIR = path.join(process.cwd(), 'src/lib/__fixtures__/journal')

const entry1 = `---
title: "Tag 1 — Der Anfang"
date: "2026-03-26"
tags: ["start"]
habits:
  movement: "steps_only"
  nutrition: "two"
  smoking: "none"
---
Erster Eintrag.
`

const entry2 = `---
title: "Tag 2 — Weiter geht es"
date: "2026-03-27"
habits:
  movement: "steps_trained"
  nutrition: "three"
  smoking: "none"
---
Zweiter Eintrag.
`

const invalidEntry = `---
title: "Broken"
date: "2026-03-28"
habits:
  movement: "invalid_value"
  nutrition: "two"
  smoking: "none"
---
Broken.
`

// Patch JOURNAL_DIR to point at fixtures during tests
vi.mock('./journal', async (importOriginal) => {
  const original = await importOriginal<typeof import('./journal')>()
  return original
})

describe('getAllEntries', () => {
  beforeEach(() => {
    fs.mkdirSync(FIXTURE_DIR, { recursive: true })
    fs.writeFileSync(path.join(FIXTURE_DIR, '2026-03-26.mdx'), entry1)
    fs.writeFileSync(path.join(FIXTURE_DIR, '2026-03-27.mdx'), entry2)
  })

  afterEach(() => {
    fs.rmSync(FIXTURE_DIR, { recursive: true, force: true })
  })

  it('returns entries sorted newest first', () => {
    const entries = _getAllEntriesFromDir(FIXTURE_DIR)
    expect(entries[0].date).toBe('2026-03-27')
    expect(entries[1].date).toBe('2026-03-26')
  })

  it('returns correct metadata for each entry', () => {
    const entries = _getAllEntriesFromDir(FIXTURE_DIR)
    const first = entries[0]
    expect(first.slug).toBe('2026-03-27')
    expect(first.title).toBe('Tag 2 — Weiter geht es')
    expect(first.habits.movement).toBe('steps_trained')
  })

  it('returns empty array when directory does not exist', () => {
    const entries = _getAllEntriesFromDir('/tmp/nonexistent-journal-dir-xyz')
    expect(entries).toEqual([])
  })

  it('throws FrontmatterValidationError for invalid entry', () => {
    fs.writeFileSync(path.join(FIXTURE_DIR, '2026-03-28.mdx'), invalidEntry)
    expect(() => _getAllEntriesFromDir(FIXTURE_DIR)).toThrow(FrontmatterValidationError)
  })
})

describe('getEntryBySlug', () => {
  beforeEach(() => {
    fs.mkdirSync(FIXTURE_DIR, { recursive: true })
    fs.writeFileSync(path.join(FIXTURE_DIR, '2026-03-26.mdx'), entry1)
  })

  afterEach(() => {
    fs.rmSync(FIXTURE_DIR, { recursive: true, force: true })
  })

  it('returns entry with content for valid slug', () => {
    const entry = _getEntryBySlugFromDir(FIXTURE_DIR, '2026-03-26')
    expect(entry).not.toBeNull()
    expect(entry!.content).toContain('Erster Eintrag.')
    expect(entry!.title).toBe('Tag 1 — Der Anfang')
    expect(entry!.tags).toEqual(['start'])
  })

  it('returns null for unknown slug', () => {
    const entry = _getEntryBySlugFromDir(FIXTURE_DIR, '2099-01-01')
    expect(entry).toBeNull()
  })
})

// =============================================
// Test helpers — read from custom dir (bypass module-level constant)
// =============================================
import matter from 'gray-matter'
import type { JournalEntry, JournalEntryMeta } from './journal'

function _getAllEntriesFromDir(dir: string): JournalEntryMeta[] {
  if (!fs.existsSync(dir)) return []
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'))
  const entries = files.map((filename) => {
    const slug = filename.replace('.mdx', '')
    const fileContent = fs.readFileSync(path.join(dir, filename), 'utf8')
    const { data } = matter(fileContent)
    return validateFrontmatter(slug, data as Record<string, unknown>)
  })
  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function _getEntryBySlugFromDir(dir: string, slug: string): JournalEntry | null {
  const filePath = path.join(dir, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null
  const fileContent = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContent)
  const meta = validateFrontmatter(slug, data as Record<string, unknown>)
  return { ...meta, content }
}

// =============================================
// getExcerpt
// =============================================

describe('getExcerpt', () => {
  it('returns the first plain-text paragraph', () => {
    const content = '\n\nDies ist der erste Absatz.\n\n## Überschrift\n\nZweiter Absatz.'
    expect(getExcerpt(content)).toBe('Dies ist der erste Absatz.')
  })

  it('skips headings', () => {
    const content = '## Überschrift\n\nErster echter Absatz.'
    expect(getExcerpt(content)).toBe('Erster echter Absatz.')
  })

  it('truncates at maxLength and appends ellipsis', () => {
    const long = 'a'.repeat(200)
    const result = getExcerpt(long, 50)
    expect(result).toHaveLength(51) // 50 chars + …
    expect(result.endsWith('…')).toBe(true)
  })

  it('strips bold markdown', () => {
    expect(getExcerpt('**Fett** und normal.')).toBe('Fett und normal.')
  })

  it('strips inline code', () => {
    expect(getExcerpt('Ein `code` Wort.')).toBe('Ein code Wort.')
  })

  it('strips links', () => {
    expect(getExcerpt('Schau mal [hier](https://example.com).')).toBe('Schau mal hier.')
  })

  it('returns empty string for empty content', () => {
    expect(getExcerpt('')).toBe('')
  })

  it('skips short lines', () => {
    const content = 'kurz\n\nDieser Satz ist lang genug um als Excerpt zu gelten.'
    expect(getExcerpt(content)).toBe('Dieser Satz ist lang genug um als Excerpt zu gelten.')
  })
})

// =============================================
// getDayNumber
// =============================================

describe('getDayNumber', () => {
  it('returns 1 for project start date', () => {
    expect(getDayNumber('2026-03-26')).toBe(1)
  })

  it('returns 2 for day after start', () => {
    expect(getDayNumber('2026-03-27')).toBe(2)
  })

  it('returns 365 for last day of project (2027-03-25)', () => {
    expect(getDayNumber('2027-03-25')).toBe(365)
  })

  it('returns correct number for arbitrary date', () => {
    expect(getDayNumber('2026-04-01')).toBe(7)
  })
})
