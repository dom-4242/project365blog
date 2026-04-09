export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/db'
import { getDayNumber } from '@/lib/journal'
import { getProjectStartDate } from '@/lib/project-config'
import { DeleteEntryButton } from '@/components/admin/DeleteEntryButton'
import { TranslateButton } from '@/components/admin/TranslateButton'
import { FlashMessage } from '@/components/admin/FlashMessage'

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-CH', { year: 'numeric', month: 'long', day: 'numeric' })
}

interface EntriesPageProps {
  searchParams: { deleted?: string }
}

export default async function EntriesPage({ searchParams }: EntriesPageProps) {
  const [entries, startDate] = await Promise.all([
    prisma.journalEntry.findMany({
      orderBy: { date: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        date: true,
        published: true,
        updatedAt: true,
        movement: true,
        nutrition: true,
        smoking: true,
        translations: { select: { locale: true, updatedAt: true } },
      },
    }),
    getProjectStartDate(),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-ctp-text">Einträge</h1>
        <Link
          href="/admin/entries/new"
          className="flex items-center gap-2 px-4 py-2 bg-nutrition-600 text-white rounded-xl text-sm font-medium hover:bg-nutrition-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Neuer Eintrag
        </Link>
      </div>

      {searchParams.deleted && (
        <FlashMessage message="Eintrag wurde erfolgreich gelöscht." />
      )}

      {entries.length === 0 ? (
        <div className="text-center py-16 text-sand-400">
          <p className="text-lg mb-2">Noch keine Einträge</p>
          <Link href="/admin/entries/new" className="text-sm text-nutrition-600 hover:text-nutrition-700">
            Ersten Eintrag erstellen →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const dateStr = entry.date.toISOString().slice(0, 10)
            const enTranslation = entry.translations.find((t) => t.locale === 'en') ?? null
            const isTranslated = !!enTranslation
            const isStale = isTranslated && enTranslation!.updatedAt < entry.updatedAt
            return (
              <div
                key={entry.id}
                className="bg-ctp-base rounded-xl border border-ctp-surface1 px-5 py-4 flex items-center gap-4 hover:border-sand-300 dark:hover:border-ctp-overlay2 transition-colors"
              >
                <span className="text-xs font-mono text-sand-400 shrink-0 w-8 text-right">
                  {getDayNumber(dateStr, startDate)}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-display font-semibold text-ctp-text truncate">
                      {entry.title}
                    </span>
                    {!entry.published && (
                      <span className="text-xs px-1.5 py-0.5 bg-ctp-surface0 text-sand-500 rounded shrink-0">
                        Entwurf
                      </span>
                    )}
                  </div>
                  <time className="text-xs text-sand-400">{formatDate(entry.date)}</time>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <TranslateButton id={entry.id} isTranslated={isTranslated} isStale={isStale} />
                  <Link
                    href={`/journal/${entry.slug}`}
                    target="_blank"
                    className="text-xs text-sand-400 hover:text-ctp-text transition-colors"
                  >
                    Ansehen ↗
                  </Link>
                  <Link
                    href={`/admin/entries/${entry.id}/edit`}
                    className="text-xs px-3 py-1.5 border border-ctp-surface1 rounded-lg text-sand-600 dark:text-sand-400 hover:border-sand-300 dark:hover:border-ctp-overlay2 hover:text-ctp-text transition-colors"
                  >
                    Bearbeiten
                  </Link>
                  <DeleteEntryButton id={entry.id} title={entry.title} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
