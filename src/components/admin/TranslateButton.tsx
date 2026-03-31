'use client'

import { useTransition, useState } from 'react'
import { translateEntry } from '@/app/admin/entries/actions'

interface TranslateButtonProps {
  id: string
  isTranslated: boolean
}

export function TranslateButton({ id, isTranslated }: TranslateButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await translateEntry(id)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isPending}
        title={isTranslated ? 'Übersetzung aktualisieren' : 'Ins Englische übersetzen'}
        className={`text-xs px-3 py-1.5 border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          error
            ? 'border-red-300 dark:border-red-700 text-red-600 dark:text-red-400'
            : isTranslated
              ? 'border-movement-300 dark:border-movement-700 text-movement-700 dark:text-movement-400 hover:bg-movement-50 dark:hover:bg-movement-900/20'
              : 'border-sand-200 dark:border-[#4a4540] text-sand-600 dark:text-sand-400 hover:border-sand-300 dark:hover:border-[#5a5550] hover:text-[#1a1714] dark:hover:text-[#faf9f7]'
        }`}
      >
        {isPending ? (
          <span className="flex items-center gap-1.5">
            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Übersetze…
          </span>
        ) : error ? (
          <span className="flex items-center gap-1.5" title={error}>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Fehler
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            {isTranslated && (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
            {isTranslated ? 'EN ✓' : 'EN übersetzen'}
          </span>
        )}
      </button>

      {error && (
        <div className="absolute right-0 top-full mt-1 z-10 w-72 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-[#2d2926] shadow-lg p-3">
          <p className="text-xs text-red-600 dark:text-red-400 leading-snug">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-1.5 text-xs text-sand-400 hover:text-sand-600 dark:hover:text-sand-300 transition-colors"
          >
            Schließen
          </button>
        </div>
      )}
    </div>
  )
}
