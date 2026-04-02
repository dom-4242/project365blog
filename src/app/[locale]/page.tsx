export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getAllEntriesForLocale } from '@/lib/journal'
import { JournalFeed } from '@/components/journal/JournalFeed'
import { HabitsDashboard } from '@/components/habits/HabitsDashboard'
import { MetricsDashboard } from '@/components/metrics/MetricsDashboard'
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_DESCRIPTION_EN,
  SITE_URL,
  buildAlternates,
  OG_LOCALE,
} from '@/lib/site'

interface HomePageProps {
  params: { locale: string }
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = params
  const isEn = locale === 'en'

  const title = isEn
    ? `${SITE_NAME} — Daily Journal`
    : `${SITE_NAME} — Tägliches Journal`
  const description = isEn ? SITE_DESCRIPTION_EN : SITE_DESCRIPTION
  const canonicalUrl = `${SITE_URL}/${locale}`
  const ogLocale = OG_LOCALE[locale] ?? OG_LOCALE.de

  return {
    title,
    description,
    alternates: {
      ...buildAlternates(`${SITE_URL}/de`, `${SITE_URL}/en`),
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      siteName: SITE_NAME,
      title,
      description,
      locale: ogLocale,
      alternateLocale: [isEn ? OG_LOCALE.de : OG_LOCALE.en],
      images: [{ url: '/og-default.png', width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-default.png'],
    },
  }
}

export default async function HomePage({ params }: HomePageProps) {
  const [entries, t] = await Promise.all([getAllEntriesForLocale(params.locale), getTranslations('HomePage')])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <header className="mb-14">
        <p className="text-xs font-medium tracking-widest uppercase text-sand-500 mb-3">
          {t('tagline')}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight text-[#1a1714] dark:text-[#faf9f7] mb-4">
          {t.rich('headline', { br: () => <br /> })}
        </h1>
        <p className="text-lg text-[#6b6560] dark:text-[#9a9088] max-w-xl leading-relaxed">
          {t('description')}
        </p>
      </header>

      <HabitsDashboard />

      <MetricsDashboard />

      <section>
        <div className="flex items-center gap-4 mb-6">
          <h2 className="font-display text-xl font-bold text-[#1a1714] dark:text-[#faf9f7] shrink-0">{t('entriesHeading')}</h2>
          <div className="flex-1 border-t border-sand-200 dark:border-[#4a4540]" aria-hidden="true" />
        </div>
        <JournalFeed entries={entries} />
      </section>
    </div>
  )
}
