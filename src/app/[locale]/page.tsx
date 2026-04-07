export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getAllEntriesForLocale, getDayNumber, PROJECT_START_DATE } from '@/lib/journal'
import { JournalCardCompact } from '@/components/journal/JournalCardCompact'
import { JournalFeed } from '@/components/journal/JournalFeed'
import { HabitsDashboard } from '@/components/habits/HabitsDashboard'
import { MetricsDashboard } from '@/components/metrics/MetricsDashboard'
import { HomeTabs } from '@/components/home/HomeTabs'
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

const FEED_PREVIEW_COUNT = 12

export default async function HomePage({ params }: HomePageProps) {
  const [entries, t] = await Promise.all([
    getAllEntriesForLocale(params.locale),
    getTranslations('HomePage'),
  ])

  const today = new Date().toISOString().slice(0, 10)
  const currentDay = getDayNumber(today)
  const previewEntries = entries.slice(0, FEED_PREVIEW_COUNT)
  const hasMore = entries.length > FEED_PREVIEW_COUNT

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">

      {/* ── Hero ───────────────────────────────────── */}
      <header className="mb-10">
        <p className="text-xs font-medium tracking-widest uppercase text-sand-500 mb-3">
          {t('tagline')}
        </p>

        <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight text-ctp-text mb-4">
          <span className="block">{t('headline_1')}</span>
          <span className="block">{t('headline_2')}</span>
        </h1>

        <p className="text-lg text-sand-500 max-w-xl leading-relaxed mb-6">
          {t('description')}
        </p>

        {/* Day counter + project description */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-sand-100 dark:bg-[#313244] border border-sand-200 dark:border-[#45475a]">
          <div className="flex-none text-center sm:text-left sm:border-r border-sand-200 dark:border-[#45475a] sm:pr-5">
            <p className="font-display text-3xl font-bold text-ctp-peach leading-none">
              {currentDay}
            </p>
            <p className="text-xs text-sand-500 mt-0.5">
              {t('dayCounter', { day: currentDay })}
            </p>
          </div>
          <p className="text-sm text-sand-500 leading-relaxed">
            {t('projectDescription')}
          </p>
        </div>
      </header>

      {/* ── Tabs ───────────────────────────────────── */}
      <HomeTabs
        labels={{
          entries: t('tabEntries'),
          habits:  t('tabHabits'),
          metrics: t('tabMetrics'),
        }}
        entriesContent={
          <div>
            <div className="space-y-1">
              {previewEntries.map((entry) => (
                <JournalCardCompact key={entry.slug} entry={entry} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-6 pt-5 border-t border-sand-200 dark:border-[#313244]">
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-sand-500 hover:text-ctp-peach transition-colors list-none flex items-center gap-2">
                    <span className="group-open:hidden">{t('allEntries', { count: entries.length })}</span>
                    <span className="hidden group-open:inline">Weniger anzeigen</span>
                  </summary>
                  <div className="mt-4 space-y-1">
                    {entries.slice(FEED_PREVIEW_COUNT).map((entry) => (
                      <JournalCardCompact key={entry.slug} entry={entry} />
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>
        }
        habitsContent={<HabitsDashboard />}
        metricsContent={<MetricsDashboard />}
      />
    </div>
  )
}
