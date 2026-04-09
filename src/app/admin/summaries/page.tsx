export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getAllMonthSummaries } from '@/lib/month-summary'
import { GenerateSummaryForm } from '@/components/admin/GenerateSummaryForm'

const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

function formatMonth(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`
}

function monthSlug(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export default async function SummariesPage() {
  const summaries = await getAllMonthSummaries()

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-ctp-text">
          Monats-Zusammenfassungen
        </h1>
      </div>

      {/* Generator */}
      <div className="bg-ctp-base rounded-xl border border-ctp-surface1 p-5 mb-6">
        <h2 className="font-display text-sm font-semibold text-ctp-text mb-3">
          Neue Zusammenfassung generieren
        </h2>
        <p className="text-xs text-sand-500 mb-4">
          Claude analysiert alle Einträge und Metriken des gewählten Monats und erstellt einen Rückblick auf Deutsch und Englisch.
        </p>
        <GenerateSummaryForm defaultYear={currentYear} defaultMonth={currentMonth} />
      </div>

      {/* List */}
      {summaries.length === 0 ? (
        <div className="text-center py-16 text-sand-400">
          <p>Noch keine Zusammenfassungen vorhanden.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {summaries.map((s) => (
            <div
              key={s.id}
              className="bg-ctp-base rounded-xl border border-ctp-surface1 px-5 py-4 flex items-center gap-4 hover:border-sand-300 dark:hover:border-ctp-overlay2 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-ctp-text text-sm">
                  {formatMonth(s.year, s.month)}
                </p>
                <p className="text-xs text-sand-400 mt-0.5">
                  Generiert: {s.generatedAt.toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' · '}
                  {s.contentEn ? 'DE + EN' : 'Nur DE'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/de/monthly/${monthSlug(s.year, s.month)}`}
                  target="_blank"
                  className="text-xs px-3 py-1.5 border border-ctp-surface1 rounded-lg text-sand-600 dark:text-sand-400 hover:border-sand-300 dark:hover:border-ctp-overlay2 hover:text-ctp-text transition-colors"
                >
                  Ansehen
                </Link>
                <Link
                  href={`/admin/summaries/${s.id}/edit`}
                  className="text-xs px-3 py-1.5 bg-ctp-surface0 border border-ctp-surface1 rounded-lg text-ctp-text hover:border-sand-300 dark:hover:border-ctp-overlay2 transition-colors"
                >
                  Bearbeiten
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
