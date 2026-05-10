import { SITE_URL } from './site'

export interface CaptionContext {
  title: string
  slug: string
  excerpt: string | null
  dailyQuote: string | null
  entryType: 'FULL' | 'FILLER'
}

/**
 * Build a sensible default caption from a JournalEntry. Full entries get
 * title + excerpt + permalink; fillers get the daily quote alone.
 * The user edits the result before publishing.
 */
export function defaultCaption(ctx: CaptionContext): string {
  if (ctx.entryType === 'FILLER') {
    if (ctx.dailyQuote) return `${ctx.dailyQuote.trim()}\n\n#project365`
    return `Tagesnotiz · #project365`
  }
  const url = `${SITE_URL}/de/journal/${ctx.slug}`
  const lines: string[] = [ctx.title.trim()]
  if (ctx.excerpt) lines.push('', ctx.excerpt.trim())
  lines.push('', url)
  return lines.join('\n')
}
