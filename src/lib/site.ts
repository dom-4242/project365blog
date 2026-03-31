export const SITE_NAME = 'Project 365'

export const SITE_DESCRIPTION =
  'Ein öffentliches 365-Tage-Projekt: Tägliche Einträge über Bewegung, Ernährung und den Weg zum Rauchstopp — mit echten Zahlen, guten und schlechten Tagen.'

export const SITE_DESCRIPTION_EN =
  'A public 365-day project: Daily entries about movement, nutrition and the journey to quit smoking — with real numbers, good days and bad.'

// Trailing slash deliberately stripped
export const SITE_URL = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '')

/** Strip HTML tags and collapse whitespace — used to derive meta descriptions from rich-text content. */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Build hreflang `alternates.languages` for Next.js metadata.
 * Always includes DE (default) and x-default. EN is optional.
 */
export function buildAlternates(deUrl: string, enUrl?: string) {
  const languages: Record<string, string> = {
    de: deUrl,
    'x-default': deUrl,
  }
  if (enUrl) languages.en = enUrl
  return { canonical: deUrl, languages }
}

/** Map locale code to Open Graph locale string */
export const OG_LOCALE: Record<string, string> = {
  de: 'de_CH',
  en: 'en_US',
}
