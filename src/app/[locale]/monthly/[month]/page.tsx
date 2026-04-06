export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getMonthSummary } from '@/lib/month-summary'
import { SITE_NAME, SITE_URL } from '@/lib/site'
import type { Metadata } from 'next'

const MONTH_NAMES_DE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

interface MonthSummaryPageProps {
  params: { locale: string; month: string }
}

function parseMonth(slug: string): { year: number; month: number } | null {
  const match = slug.match(/^(\d{4})-(\d{2})$/)
  if (!match) return null
  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  if (month < 1 || month > 12) return null
  return { year, month }
}

export async function generateMetadata({ params }: MonthSummaryPageProps): Promise<Metadata> {
  const parsed = parseMonth(params.month)
  if (!parsed) return {}

  const summary = await getMonthSummary(parsed.year, parsed.month)
  if (!summary) return {}

  const monthNames = params.locale === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_DE
  const monthName = monthNames[parsed.month - 1]
  const title = params.locale === 'en'
    ? `${monthName} ${parsed.year} — Monthly Summary`
    : `${monthName} ${parsed.year} — Monats-Zusammenfassung`

  const canonicalUrl = `${SITE_URL}/${params.locale}/monthly/${params.month}`

  return {
    title,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        de: `${SITE_URL}/de/monthly/${params.month}`,
        en: `${SITE_URL}/en/monthly/${params.month}`,
      },
    },
    openGraph: {
      type: 'article',
      url: canonicalUrl,
      siteName: SITE_NAME,
      title,
    },
  }
}

export default async function MonthSummaryPage({ params }: MonthSummaryPageProps) {
  const parsed = parseMonth(params.month)
  if (!parsed) notFound()

  const { year, month } = parsed
  const summary = await getMonthSummary(year, month)
  if (!summary) notFound()

  const t = await getTranslations({ locale: params.locale, namespace: 'MonthlySummary' })
  const monthNames = params.locale === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_DE
  const monthName = monthNames[month - 1]

  const isEn = params.locale === 'en'
  const content = isEn && summary.contentEn ? summary.contentEn : summary.contentDe

  return (
    <article className="max-w-2xl mx-auto py-12 px-4">
      {/* Back */}
      <Link
        href={`/${params.locale}/monthly`}
        className="inline-block text-sm text-sand-400 hover:text-[#1a1714] dark:hover:text-[#faf9f7] mb-8 transition-colors"
      >
        ← {t('backToOverview')}
      </Link>

      {/* Header */}
      <header className="mb-8">
        <p className="text-xs font-semibold text-nutrition-600 dark:text-nutrition-400 uppercase tracking-wide mb-2">
          {t('summaryLabel')}
        </p>
        <h1 className="font-display text-4xl font-bold text-[#1a1714] dark:text-[#faf9f7]">
          {monthName} {year}
        </h1>
        <p className="text-xs text-sand-400 mt-2">
          {t('generatedOn', { date: summary.generatedAt.toLocaleDateString(isEn ? 'en-GB' : 'de-CH', { day: 'numeric', month: 'long', year: 'numeric' }) })}
          {isEn && !summary.contentEn && (
            <span className="ml-2 italic">(Original auf Deutsch)</span>
          )}
        </p>
      </header>

      {/* Content */}
      <div
        className="prose prose-sand dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </article>
  )
}
