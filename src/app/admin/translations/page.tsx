export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/db'
import { getDayNumber } from '@/lib/journal'
import { getProjectStartDate } from '@/lib/project-config'
import { TranslateButton } from '@/components/admin/TranslateButton'

type TranslationStatus = 'current' | 'stale' | 'missing'

function getStatus(
  entryUpdatedAt: Date,
  translation: { updatedAt: Date } | null,
): TranslationStatus {
  if (!translation) return 'missing'
  return translation.updatedAt >= entryUpdatedAt ? 'current' : 'stale'
}

function StatusBadge({ status }: { status: TranslationStatus }) {
  if (status === 'current') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-movement-100 dark:bg-movement-900/30 text-movement-700 dark:text-movement-400 rounded-full">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        Übersetzt
      </span>
    )
  }
  if (status === 'stale') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        Veraltet
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-ctp-surface0 text-sand-500 rounded-full">
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      Fehlt
    </span>
  )
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function TranslationsPage() {
  const [entries, startDate] = await Promise.all([
    prisma.journalEntry.findMany({
      orderBy: { date: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        date: true,
        updatedAt: true,
        translations: { select: { locale: true, updatedAt: true } },
      },
    }),
    getProjectStartDate(),
  ])

  const enStatuses = entries.map((e) => getStatus(e.updatedAt, e.translations.find((t) => t.locale === 'en') ?? null))
  const ptStatuses = entries.map((e) => getStatus(e.updatedAt, e.translations.find((t) => t.locale === 'pt') ?? null))
  const countCurrent = enStatuses.filter((s) => s === 'current').length
  const countStale = enStatuses.filter((s) => s === 'stale').length
  const countMissing = enStatuses.filter((s) => s === 'missing').length

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ctp-text mb-6">
        Übersetzungen
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-ctp-base rounded-xl border border-ctp-surface1 px-5 py-4">
          <p className="text-2xl font-bold font-display text-movement-600 dark:text-movement-400">{countCurrent}</p>
          <p className="text-xs text-sand-400 mt-0.5">Übersetzt</p>
        </div>
        <div className="bg-ctp-base rounded-xl border border-ctp-surface1 px-5 py-4">
          <p className="text-2xl font-bold font-display text-amber-600 dark:text-amber-400">{countStale}</p>
          <p className="text-xs text-sand-400 mt-0.5">Veraltet</p>
        </div>
        <div className="bg-ctp-base rounded-xl border border-ctp-surface1 px-5 py-4">
          <p className="text-2xl font-bold font-display text-sand-500">{countMissing}</p>
          <p className="text-xs text-sand-400 mt-0.5">Fehlen</p>
        </div>
      </div>

      {/* Entry list */}
      {entries.length === 0 ? (
        <div className="text-center py-16 text-sand-400">
          <p>Noch keine Einträge vorhanden.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => {
            const enStatus = enStatuses[i]
            const ptStatus = ptStatuses[i]
            const dateStr = entry.date.toISOString().slice(0, 10)
            return (
              <div
                key={entry.id}
                className="bg-ctp-base rounded-xl border border-ctp-surface1 px-5 py-4 flex items-center gap-4 hover:border-sand-300 dark:hover:border-ctp-overlay2 transition-colors"
              >
                <span className="text-xs font-mono text-sand-400 shrink-0 w-8 text-right">
                  {getDayNumber(dateStr, startDate)}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-ctp-text truncate text-sm">
                    {entry.title}
                  </p>
                  <time className="text-xs text-sand-400">{formatDate(entry.date)}</time>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-mono text-sand-400">EN</span>
                  <StatusBadge status={enStatus} />
                  <span className="text-xs font-mono text-sand-400 ml-2">PT</span>
                  <StatusBadge status={ptStatus} />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <TranslateButton
                    id={entry.id}
                    isTranslated={enStatus !== 'missing'}
                    isStale={enStatus === 'stale'}
                  />
                  <Link
                    href={`/admin/translations/${entry.id}`}
                    className="text-xs px-3 py-1.5 border border-ctp-surface1 rounded-lg text-sand-600 dark:text-sand-400 hover:border-sand-300 dark:hover:border-ctp-overlay2 hover:text-ctp-text transition-colors"
                  >
                    Bearbeiten
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
