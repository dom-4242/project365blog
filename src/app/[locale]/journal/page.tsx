export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getAllEntriesForLocale } from '@/lib/journal'
import { JournalFeed } from '@/components/journal/JournalFeed'
import { Icon } from '@/components/ui/Icon'
import { SITE_NAME, SITE_URL, buildAlternates, OG_LOCALE } from '@/lib/site'

interface JournalPageProps {
  params: { locale: string }
}

export async function generateMetadata({ params }: JournalPageProps): Promise<Metadata> {
  const { locale } = params
  const t = await getTranslations({ locale, namespace: 'JournalPage' })

  const title = `${t('title')} — ${SITE_NAME}`
  const description = t('description')
  const canonicalUrl = `${SITE_URL}/${locale}/journal`
  const ogLocale = OG_LOCALE[locale] ?? OG_LOCALE.de

  return {
    title,
    description,
    alternates: {
      ...buildAlternates(
        `${SITE_URL}/de/journal`,
        `${SITE_URL}/en/journal`,
        `${SITE_URL}/pt/journal`,
      ),
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      siteName: SITE_NAME,
      title,
      description,
      locale: ogLocale,
      images: [{ url: '/og-default.png', width: 1200, height: 630, alt: SITE_NAME }],
    },
  }
}

export default async function JournalPage({ params }: JournalPageProps) {
  const [entries, t] = await Promise.all([
    getAllEntriesForLocale(params.locale),
    getTranslations('JournalPage'),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

      {/* Page header */}
      <header className="mb-10">
        <Link
          href={`/${params.locale}`}
          className="inline-flex items-center gap-1.5 text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant hover:text-on-surface transition-colors group mb-6"
        >
          <Icon name="arrow_back" size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          {t('backHome')}
        </Link>

        <h1 className="font-headline font-bold tracking-tighter text-4xl sm:text-5xl text-on-surface mb-3">
          {t('title')}
        </h1>
        <p className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant">
          {t('entryCount', { count: entries.length })}
        </p>
      </header>

      <JournalFeed entries={entries} />

    </div>
  )
}
