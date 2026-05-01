export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getMonthSummary } from '@/lib/month-summary'
import { SITE_NAME, SITE_URL } from '@/lib/site'
import type { Metadata } from 'next'

const MONTH_NAMES_DE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTH_NAMES_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

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

  const monthNames = params.locale === 'en' ? MONTH_NAMES_EN : params.locale === 'pt' ? MONTH_NAMES_PT : MONTH_NAMES_DE
  const monthName = monthNames[parsed.month - 1]
  const title = params.locale === 'en'
    ? `${monthName} ${parsed.year} — Monthly Summary`
    : params.locale === 'pt'
    ? `${monthName} ${parsed.year} — Resumo Mensal`
    : `${monthName} ${parsed.year} — Monats-Zusammenfassung`

  const canonicalUrl = `${SITE_URL}/${params.locale}/monthly/${params.month}`

  return {
    title,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        de: `${SITE_URL}/de/monthly/${params.month}`,
        en: `${SITE_URL}/en/monthly/${params.month}`,
        pt: `${SITE_URL}/pt/monthly/${params.month}`,
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
  const monthNames = params.locale === 'en' ? MONTH_NAMES_EN : params.locale === 'pt' ? MONTH_NAMES_PT : MONTH_NAMES_DE
  const monthName = monthNames[month - 1]

  const locale = params.locale
  const content =
    locale === 'en' && summary.contentEn ? summary.contentEn :
    locale === 'pt' && summary.contentPt ? summary.contentPt :
    summary.contentDe

  return (
    <article className="max-w-2xl mx-auto py-12 px-4">
      {/* Back */}
      <Link
        href={`/${params.locale}/monthly`}
        className="inline-block text-sm text-on-surface-variant hover:text-on-surface mb-8 transition-colors"
      >
        ← {t('backToOverview')}
      </Link>

      {/* Header */}
      <header className="mb-8">
        <p className="text-xs font-semibold text-nutrition-600 text-nutrition-400 uppercase tracking-wide mb-2">
          {t('summaryLabel')}
        </p>
        <h1 className="font-headline text-4xl font-bold text-on-surface">
          {monthName} {year}
        </h1>
        <p className="text-xs text-on-surface-variant mt-2">
          {t('generatedOn', { date: summary.generatedAt.toLocaleDateString(locale === 'en' ? 'en-GB' : locale === 'pt' ? 'pt-BR' : 'de-CH', { day: 'numeric', month: 'long', year: 'numeric' }) })}
          {locale === 'en' && !summary.contentEn && (
            <span className="ml-2 italic">(Original auf Deutsch)</span>
          )}
          {locale === 'pt' && !summary.contentPt && (
            <span className="ml-2 italic">(Original em Alemão)</span>
          )}
        </p>
      </header>

      {/* Content */}
      <div
        className="prose prose-sand prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </article>
  )
}
