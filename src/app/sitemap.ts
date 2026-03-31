export const dynamic = 'force-dynamic'

import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'
import { SITE_URL } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await prisma.journalEntry.findMany({
    where: { published: true },
    orderBy: { date: 'desc' },
    select: {
      slug: true,
      date: true,
      translation: { select: { updatedAt: true } },
    },
  })

  const routes: MetadataRoute.Sitemap = [
    // Home — both locales
    {
      url: `${SITE_URL}/de`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/en`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  for (const entry of entries) {
    const lastMod = new Date(entry.date)

    // DE entry — always included
    routes.push({
      url: `${SITE_URL}/de/journal/${entry.slug}`,
      lastModified: lastMod,
      changeFrequency: 'monthly',
      priority: 0.8,
    })

    // EN entry — only if translation exists (avoid duplicate-content penalty)
    if (entry.translation) {
      routes.push({
        url: `${SITE_URL}/en/journal/${entry.slug}`,
        lastModified: entry.translation.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  }

  return routes
}
