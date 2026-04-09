export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { getDayNumber } from '@/lib/journal'
import { getProjectStartDate } from '@/lib/project-config'
import { TranslationEditForm } from '@/components/admin/TranslationEditForm'

interface TranslationDetailPageProps {
  params: { entryId: string }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-CH', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function TranslationDetailPage({ params }: TranslationDetailPageProps) {
  const [entry, startDate] = await Promise.all([
    prisma.journalEntry.findUnique({
      where: { id: params.entryId },
      include: { translations: true },
    }),
    getProjectStartDate(),
  ])

  if (!entry) notFound()

  const dateStr = entry.date.toISOString().slice(0, 10)
  const enTranslation = entry.translations.find((t) => t.locale === 'en') ?? null
  const ptTranslation = entry.translations.find((t) => t.locale === 'pt') ?? null

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/translations"
              className="text-sm text-sand-400 hover:text-[#1a1714] dark:hover:text-[#faf9f7] transition-colors"
            >
              ← Übersetzungen
            </Link>
          </div>
          <h1 className="font-display text-2xl font-bold text-[#1a1714] dark:text-[#faf9f7]">
            {entry.title}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-mono text-sand-400">Tag {getDayNumber(dateStr, startDate)}</span>
            <span className="text-xs text-sand-400">{formatDate(entry.date)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {enTranslation && (
            <Link
              href={`/en/journal/${entry.slug}`}
              target="_blank"
              className="text-xs text-sand-400 hover:text-[#1a1714] dark:hover:text-[#faf9f7] transition-colors"
            >
              EN ↗
            </Link>
          )}
          {ptTranslation && (
            <Link
              href={`/pt/journal/${entry.slug}`}
              target="_blank"
              className="text-xs text-sand-400 hover:text-[#1a1714] dark:hover:text-[#faf9f7] transition-colors"
            >
              PT ↗
            </Link>
          )}
        </div>
      </div>

      {/* Three-column layout: DE original | EN translation | PT translation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DE original (read-only) */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-sand-500 uppercase tracking-wide flex items-center gap-2">
            <span className="text-xs px-1.5 py-0.5 bg-sand-100 dark:bg-[#3a3531] text-sand-600 dark:text-sand-400 rounded font-mono">DE</span>
            Original
          </h2>

          <div className="rounded-xl border border-sand-200 dark:border-[#4a4540] bg-white dark:bg-[#2d2926] p-4 space-y-4">
            <div>
              <p className="text-xs font-medium text-sand-400 uppercase tracking-wide mb-1">Titel</p>
              <p className="text-sm font-semibold text-[#1a1714] dark:text-[#faf9f7]">{entry.title}</p>
            </div>
            {entry.excerpt && (
              <div>
                <p className="text-xs font-medium text-sand-400 uppercase tracking-wide mb-1">Excerpt</p>
                <p className="text-sm text-sand-600 dark:text-sand-400">{entry.excerpt}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-sand-400 uppercase tracking-wide mb-1">Inhalt (HTML)</p>
              <div className="text-xs font-mono text-sand-500 dark:text-sand-400 bg-sand-50 dark:bg-[#1a1714] rounded-lg p-3 max-h-64 overflow-y-auto whitespace-pre-wrap break-all">
                {entry.content}
              </div>
            </div>
          </div>
        </div>

        {/* EN translation (editable) */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-sand-500 uppercase tracking-wide flex items-center gap-2">
            <span className="text-xs px-1.5 py-0.5 bg-nutrition-100 dark:bg-nutrition-900/30 text-nutrition-700 dark:text-nutrition-400 rounded font-mono">EN</span>
            Englisch
          </h2>

          <div className="rounded-xl border border-sand-200 dark:border-[#4a4540] bg-white dark:bg-[#2d2926] p-4">
            {enTranslation ? (
              <TranslationEditForm
                entryId={entry.id}
                locale="en"
                initialTitle={enTranslation.title}
                initialExcerpt={enTranslation.excerpt ?? ''}
                initialContent={enTranslation.content}
              />
            ) : (
              <div className="space-y-3 py-4">
                <p className="text-sm text-sand-400 text-center">Noch keine EN-Übersetzung.</p>
                <TranslationEditForm
                  entryId={entry.id}
                  locale="en"
                  initialTitle=""
                  initialExcerpt=""
                  initialContent=""
                />
              </div>
            )}
          </div>
        </div>

        {/* PT translation (editable) */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-sand-500 uppercase tracking-wide flex items-center gap-2">
            <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded font-mono">PT</span>
            Portugiesisch (BR)
          </h2>

          <div className="rounded-xl border border-sand-200 dark:border-[#4a4540] bg-white dark:bg-[#2d2926] p-4">
            {ptTranslation ? (
              <TranslationEditForm
                entryId={entry.id}
                locale="pt"
                initialTitle={ptTranslation.title}
                initialExcerpt={ptTranslation.excerpt ?? ''}
                initialContent={ptTranslation.content}
              />
            ) : (
              <div className="space-y-3 py-4">
                <p className="text-sm text-sand-400 text-center">Noch keine PT-Übersetzung.</p>
                <TranslationEditForm
                  entryId={entry.id}
                  locale="pt"
                  initialTitle=""
                  initialExcerpt=""
                  initialContent=""
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
