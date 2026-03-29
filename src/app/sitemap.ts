export const dynamic = 'force-dynamic'

import type { MetadataRoute } from 'next'
import { getAllEntries } from '@/lib/journal'
import { SITE_URL } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getAllEntries()

  const entryRoutes: MetadataRoute.Sitemap = entries.map((entry) => ({
    url: `${SITE_URL}/journal/${entry.slug}`,
    lastModified: new Date(entry.date),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...entryRoutes,
  ]
}
