'use client'

import { useTransition, useState } from 'react'
import { translateEntry } from '@/app/admin/entries/actions'

interface TranslateButtonProps {
  id: string
  isTranslated: boolean
  isStale?: boolean
}

export function TranslateButton({ id, isTranslated, isStale = false }: TranslateButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await translateEntry(id)
      if (result.error) setError(result.error)
    })
  }

  const isOutdated = isTranslated && isStale

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isPending}
        title={
          isPending ? 'Übersetze…'
          : isOutdated ? 'Übersetzung ist veraltet — neu übersetzen'
          : isTranslated ? 'Übersetzung aktualisieren'
          : 'Ins Englische übersetzen'
        }
        className={`text-xs px-3 py-1.5 border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          error
            ? 'border-red-300 border-red-700 text-red-600 text-red-400'
            : isOutdated
              ? 'border-amber-300 border-amber-700 text-amber-700 text-amber-400 hover:bg-amber-50 hover:bg-amber-900/20'
              : isTranslated
                ? 'border-movement-300 border-movement-700 text-movement-700 text-movement-400 hover:bg-movement-50 hover:bg-movement-900/20'
                : 'border-surface-container-high text-on-surface-variant text-on-surface-variant hover:border-outline hover:border-on-surface-variant hover:text-on-surface'
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
        ) : isOutdated ? (
          <span className="flex items-center gap-1.5">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            EN veraltet
          </span>
        ) : isTranslated ? (
          <span className="flex items-center gap-1.5">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            EN ✓
          </span>
        ) : (
          <span>EN übersetzen</span>
        )}
      </button>

      {error && (
        <div className="absolute right-0 top-full mt-1 z-10 w-72 rounded-lg border border-red-200 border-red-800 bg-surface-container shadow-lg p-3">
          <p className="text-xs text-red-600 text-red-400 leading-snug">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-1.5 text-xs text-on-surface-variant hover:text-on-surface-variant hover:text-outline transition-colors"
          >
            Schließen
          </button>
        </div>
      )}
    </div>
  )
}
