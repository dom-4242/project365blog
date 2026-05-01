export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getAllEntriesForLocale, getDayNumber } from '@/lib/journal'
import { getProjectStartDate } from '@/lib/project-config'
import { JournalCardHome } from '@/components/journal/JournalCardHome'
import { HabitsDashboard } from '@/components/habits/HabitsDashboard'
import { MetricsDashboard } from '@/components/metrics/MetricsDashboard'
import { HomeTabs } from '@/components/home/HomeTabs'
import { LiveStatus } from '@/components/home/LiveStatus'
import { Icon } from '@/components/ui/Icon'
import Image from 'next/image'
import Link from 'next/link'
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_DESCRIPTION_EN,
  SITE_URL,
  buildAlternates,
  OG_LOCALE,
} from '@/lib/site'
import { getLatestMonthSummary } from '@/lib/month-summary'

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
      ...buildAlternates(`${SITE_URL}/de`, `${SITE_URL}/en`, `${SITE_URL}/pt`),
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

const JOURNAL_HOME_COUNT = 3

export default async function HomePage({ params }: HomePageProps) {
  const [entries, t, startDate, latestSummary] = await Promise.all([
    getAllEntriesForLocale(params.locale),
    getTranslations('HomePage'),
    getProjectStartDate(),
    getLatestMonthSummary(),
  ])

  const today = new Date().toISOString().slice(0, 10)
  const currentDay = getDayNumber(today, startDate)
  const latestEntries = entries.slice(0, JOURNAL_HOME_COUNT)

  const MONTH_NAMES: Record<string, string[]> = {
    de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    pt: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  }
  const locale = params.locale
  const summaryContent = latestSummary
    ? (locale === 'en' && latestSummary.contentEn ? latestSummary.contentEn
      : locale === 'pt' && latestSummary.contentPt ? latestSummary.contentPt
      : latestSummary.contentDe)
    : null
  const summaryMonthName = latestSummary
    ? (MONTH_NAMES[locale] ?? MONTH_NAMES.de)[latestSummary.month - 1]
    : null
  const summarySlug = latestSummary
    ? `${latestSummary.year}-${String(latestSummary.month).padStart(2, '0')}`
    : null

  return (
    <div>

      {/* ── Hero Section ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-outline-variant/10 min-h-[480px] sm:min-h-[560px]">

        {/* Cinematic hero background image */}
        <div className="absolute inset-0" aria-hidden="true">
          <Image
            src="/hero-bg.svg"
            alt="Kinematische Berglandschaft bei Sonnenuntergang"
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        {/* Horizontal gradient: dark left → transparent right (text readability) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.65) 40%, rgba(0,0,0,0.25) 70%, rgba(0,0,0,0.05) 100%)' }}
          aria-hidden="true"
        />

        {/* Vertical fade bottom: image → background (#0e0e0e) */}
        <div
          className="absolute inset-x-0 bottom-0 h-48 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(14,14,14,0) 0%, rgba(14,14,14,0.7) 60%, rgba(14,14,14,1) 100%)' }}
          aria-hidden="true"
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-14 sm:pt-24 sm:pb-20">

          {/* Live day badge */}
          <div className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 rounded border border-primary/20 bg-primary/5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
            <span className="text-xs font-label font-bold tracking-widest uppercase text-primary">
              {t('dayCounter', { day: currentDay })}
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-headline font-bold tracking-tighter leading-none mb-6">
            <span className="block text-5xl sm:text-7xl text-on-surface">{t('headline_1')}</span>
            <span className="block text-5xl sm:text-7xl text-primary">{t('headline_2')}</span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-on-surface-variant max-w-lg leading-relaxed mb-8">
            {t('description')}
          </p>

          {/* CTA */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/${params.locale}/about`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-label font-bold tracking-widest uppercase text-xs rounded hover:bg-primary-container transition-colors"
            >
              <Icon name="info" size={14} />
              {t('ctaAbout')}
            </Link>
            <a
              href="#journal"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-outline-variant/30 text-on-surface-variant font-label font-bold tracking-widest uppercase text-xs rounded hover:border-primary/40 hover:text-primary transition-colors"
            >
              <Icon name="arrow_downward" size={14} />
              {t('ctaEntries')}
            </a>
          </div>

        </div>
      </section>

      {/* ── Live Status Bento-Grid ──────────────────────────────────── */}
      <LiveStatus />

      {/* ── Journal / Habits / Metrics Tabs ────────────────────────── */}
      <section id="journal" className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <HomeTabs
          labels={{
            entries: t('tabEntries'),
            habits:  t('tabHabits'),
            metrics: t('tabMetrics'),
          }}
          entriesContent={
            <div className="space-y-6">
              {/* Section header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant">
                  {t('journalSectionHeading')}
                </h2>
                <Link
                  href={`/${params.locale}/journal`}
                  className="group inline-flex items-center gap-2 text-xs font-label font-bold tracking-widest uppercase text-primary hover:gap-3 transition-all duration-150"
                >
                  {t('journalViewAll')}
                  <Icon name="arrow_forward" size={14} />
                </Link>
              </div>

              {/* 3-card grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {latestEntries.map((entry) => (
                  <JournalCardHome key={entry.slug} entry={entry} />
                ))}
              </div>

              {/* Monthly summary */}
              {latestSummary && summaryContent && summarySlug && (
                <div className="mt-10 border-t border-outline-variant/15 pt-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant mb-1">
                        {t('monthlySummaryHeading')}
                      </p>
                      <h2 className="font-headline text-2xl font-bold text-on-surface">
                        {summaryMonthName} {latestSummary.year}
                      </h2>
                    </div>
                    <Link
                      href={`/${locale}/monthly/${summarySlug}`}
                      className="group inline-flex items-center gap-2 text-xs font-label font-bold tracking-widest uppercase text-primary hover:gap-3 transition-all duration-150 shrink-0"
                    >
                      {t('monthlySummaryReadMore')}
                      <Icon name="arrow_forward" size={14} />
                    </Link>
                  </div>
                  <div
                    className="prose prose-invert max-w-none text-on-surface-variant [&_h2]:font-headline [&_h2]:text-on-surface [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_strong]:text-on-surface [&_p]:leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: summaryContent }}
                  />
                  <div className="mt-6 pt-6 border-t border-outline-variant/15">
                    <Link
                      href={`/${locale}/monthly`}
                      className="group inline-flex items-center gap-2 text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <Icon name="calendar_month" size={14} />
                      {t('monthlySummaryViewAll')}
                      <Icon name="arrow_forward" size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          }
          habitsContent={<HabitsDashboard />}
          metricsContent={<MetricsDashboard />}
        />
      </section>

    </div>
  )
}
