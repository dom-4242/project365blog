'use client'

import { useState, useTransition } from 'react'
import { updateSummaryAction, deleteSummaryAction } from '@/app/admin/summaries/actions'

interface SummaryData {
  id: string
  year: number
  month: number
  contentDe: string
  contentEn: string | null
}

interface SummaryEditFormProps {
  summary: SummaryData
}

export function SummaryEditForm({ summary }: SummaryEditFormProps) {
  const [contentDe, setContentDe] = useState(summary.contentDe)
  const [contentEn, setContentEn] = useState(summary.contentEn ?? '')
  const [activeTab, setActiveTab] = useState<'de' | 'en'>('de')
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    startTransition(async () => {
      try {
        await updateSummaryAction(summary.id, contentDe, contentEn)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Speichern')
      }
    })
  }

  function handleDelete() {
    if (!confirm('Zusammenfassung wirklich löschen?')) return
    startDeleteTransition(async () => {
      await deleteSummaryAction(summary.id)
    })
  }

  const monthSlug = `${summary.year}-${String(summary.month).padStart(2, '0')}`

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-sand-200 dark:border-[#4a4540]">
        {(['de', 'en'] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setActiveTab(lang)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === lang
                ? 'border-nutrition-600 text-nutrition-700 dark:text-nutrition-400'
                : 'border-transparent text-sand-500 hover:text-[#1a1714] dark:hover:text-[#faf9f7]'
            }`}
          >
            {lang === 'de' ? 'Deutsch' : 'English'}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div>
        {activeTab === 'de' ? (
          <textarea
            value={contentDe}
            onChange={(e) => setContentDe(e.target.value)}
            rows={24}
            className="w-full font-mono text-xs px-4 py-3 rounded-xl border border-sand-200 dark:border-[#4a4540] bg-white dark:bg-[#1a1714] text-[#1a1714] dark:text-[#faf9f7] focus:outline-none focus:ring-2 focus:ring-nutrition-400 resize-none"
            placeholder="HTML-Content auf Deutsch…"
          />
        ) : (
          <textarea
            value={contentEn}
            onChange={(e) => setContentEn(e.target.value)}
            rows={24}
            className="w-full font-mono text-xs px-4 py-3 rounded-xl border border-sand-200 dark:border-[#4a4540] bg-white dark:bg-[#1a1714] text-[#1a1714] dark:text-[#faf9f7] focus:outline-none focus:ring-2 focus:ring-nutrition-400 resize-none"
            placeholder="HTML content in English…"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors disabled:opacity-50"
        >
          {isDeleting ? 'Löschen…' : 'Zusammenfassung löschen'}
        </button>

        <div className="flex items-center gap-3">
          <a
            href={`/de/monthly/${monthSlug}`}
            target="_blank"
            className="text-xs px-3 py-2 border border-sand-200 dark:border-[#4a4540] rounded-lg text-sand-600 dark:text-sand-400 hover:border-sand-300 hover:text-[#1a1714] dark:hover:text-[#faf9f7] transition-colors"
          >
            Vorschau
          </a>
          {saved && (
            <span className="text-xs text-movement-600 dark:text-movement-400">Gespeichert ✓</span>
          )}
          {error && (
            <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-nutrition-600 text-white hover:bg-nutrition-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Speichern…' : 'Speichern'}
          </button>
        </div>
      </div>
    </form>
  )
}
