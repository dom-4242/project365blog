export const dynamic = 'force-dynamic'

import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getAllMonthSummaries } from '@/lib/month-summary'

const MONTH_NAMES_DE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function monthSlug(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

interface MonthlyOverviewPageProps {
  params: { locale: string }
}

export default async function MonthlyOverviewPage({ params }: MonthlyOverviewPageProps) {
  const t = await getTranslations({ locale: params.locale, namespace: 'MonthlySummary' })
  const summaries = await getAllMonthSummaries()
  const monthNames = params.locale === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_DE

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="font-display text-3xl font-bold text-[#1a1714] dark:text-[#faf9f7] mb-2">
        {t('overviewHeading')}
      </h1>
      <p className="text-sand-500 mb-10">{t('overviewDescription')}</p>

      {summaries.length === 0 ? (
        <p className="text-sand-400">{t('noSummaries')}</p>
      ) : (
        <div className="space-y-3">
          {summaries.map((s) => (
            <Link
              key={s.id}
              href={`/${params.locale}/monthly/${monthSlug(s.year, s.month)}`}
              className="flex items-center justify-between bg-white dark:bg-[#2d2926] rounded-xl border border-sand-200 dark:border-[#4a4540] px-6 py-4 hover:border-sand-300 dark:hover:border-[#5a5550] hover:shadow-sm transition-all group"
            >
              <div>
                <p className="font-display font-semibold text-[#1a1714] dark:text-[#faf9f7] group-hover:text-nutrition-700 dark:group-hover:text-nutrition-400 transition-colors">
                  {monthNames[s.month - 1]} {s.year}
                </p>
                <p className="text-xs text-sand-400 mt-0.5">
                  {t('generatedOn', { date: s.generatedAt.toLocaleDateString(params.locale === 'en' ? 'en-GB' : 'de-CH', { day: 'numeric', month: 'long', year: 'numeric' }) })}
                </p>
              </div>
              <span className="text-sand-400 group-hover:text-nutrition-600 transition-colors">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
