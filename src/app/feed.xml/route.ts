export const dynamic = 'force-dynamic'

import { getAllEntries } from '@/lib/journal'
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from '@/lib/site'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const entries = await getAllEntries()

  const items = entries
    .map((entry) => {
      const url = `${SITE_URL}/journal/${entry.slug}`
      const pubDate = new Date(entry.date).toUTCString()

      return `
    <item>
      <title>${escapeXml(entry.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(entry.excerpt ?? '')}</description>
      ${entry.tags?.map((t) => `<category>${escapeXml(t)}</category>`).join('\n      ') ?? ''}
    </item>`
    })
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>de</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>1440</ttl>${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
