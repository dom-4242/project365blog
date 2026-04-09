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
      translations: { select: { locale: true, updatedAt: true } },
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
    {
      url: `${SITE_URL}/pt`,
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

    const enTranslation = entry.translations.find((t) => t.locale === 'en') ?? null
    const ptTranslation = entry.translations.find((t) => t.locale === 'pt') ?? null

    // EN entry — only if translation exists (avoid duplicate-content penalty)
    if (enTranslation) {
      routes.push({
        url: `${SITE_URL}/en/journal/${entry.slug}`,
        lastModified: enTranslation.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }

    // PT entry — only if translation exists
    if (ptTranslation) {
      routes.push({
        url: `${SITE_URL}/pt/journal/${entry.slug}`,
        lastModified: ptTranslation.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  }

  return routes
}
