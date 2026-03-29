export const SITE_NAME = 'Project 365'

export const SITE_DESCRIPTION =
  'Ein öffentliches 365-Tage-Projekt: Tägliche Einträge über Bewegung, Ernährung und den Weg zum Rauchstopp — mit echten Zahlen, guten und schlechten Tagen.'

// Trailing slash deliberately stripped
export const SITE_URL = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '')

/** Strip HTML tags and collapse whitespace — used to derive meta descriptions from rich-text content. */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}
