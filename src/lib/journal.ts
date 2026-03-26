import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const JOURNAL_DIR = path.join(process.cwd(), 'content/journal')

export interface HabitsFrontmatter {
  movement: 'minimal' | 'steps_only' | 'steps_trained'
  nutrition: 'none' | 'one' | 'two' | 'three'
  smoking: 'smoked' | 'replacement' | 'none'
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

export function getAllEntries(): JournalEntryMeta[] {
  if (!fs.existsSync(JOURNAL_DIR)) return []

  const files = fs.readdirSync(JOURNAL_DIR).filter((f) => f.endsWith('.mdx'))

  const entries = files.map((filename) => {
    const slug = filename.replace('.mdx', '')
    const filePath = path.join(JOURNAL_DIR, filename)
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const { data } = matter(fileContent)

    return {
      slug,
      title: data.title as string,
      date: data.date as string,
      banner: data.banner as string | undefined,
      tags: data.tags as string[] | undefined,
      habits: data.habits as HabitsFrontmatter,
    }
  })

  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getEntryBySlug(slug: string): JournalEntry | null {
  const filePath = path.join(JOURNAL_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null

  const fileContent = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContent)

  return {
    slug,
    title: data.title as string,
    date: data.date as string,
    banner: data.banner as string | undefined,
    tags: data.tags as string[] | undefined,
    habits: data.habits as HabitsFrontmatter,
    content,
  }
}
