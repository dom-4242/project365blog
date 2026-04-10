'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import type { SearchResult } from '@/app/api/search/route'
import { Icon } from '@/components/ui/Icon'

// =============================================
// Highlight — wraps matched substring
// =============================================

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-nutrition-200 bg-nutrition-800/60 text-inherit not-italic rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

// =============================================
// SearchModal
// =============================================

export function SearchModal() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('SearchModal')

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  // Open with ⌘K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setActiveIndex(-1)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        const data = (await res.json()) as { results: SearchResult[] }
        setResults(data.results)
        setActiveIndex(-1)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const navigate = useCallback(
    (slug: string) => {
      setOpen(false)
      router.push(`/journal/${slug}`)
    },
    [router]
  )

  // Keyboard navigation through results
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      navigate(results[activeIndex].slug)
    }
  }

  const showEmpty = !loading && query.trim().length >= 2 && results.length === 0

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('ariaLabel')}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
      >
        <Icon name="search" size={18} />
        <span className="hidden sm:inline text-xs">
          <kbd className="font-sans text-on-surface-variant">⌘K</kbd>
        </span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('dialogAriaLabel')}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal card — glassmorphism */}
          <div className="relative w-full max-w-xl bg-surface-container-low/90 backdrop-blur-xl rounded-xl border border-outline-variant/20 shadow-2xl overflow-hidden">

            {/* Input row */}
            <div className="flex items-center gap-3 px-4 border-b border-outline-variant/15">
              <Icon name="search" size={18} className="text-on-surface-variant shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t('placeholder')}
                className="flex-1 py-4 text-sm text-on-surface bg-transparent focus:outline-none placeholder:text-on-surface-variant"
              />
              {loading && (
                <svg className="w-4 h-4 text-on-surface-variant animate-spin shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 text-xs text-on-surface-variant hover:text-outline transition-colors px-1.5 py-1 rounded border border-outline-variant/30"
              >
                ESC
              </button>
            </div>

            {/* Results */}
            {results.length > 0 && (
              <ul className="max-h-[60vh] overflow-y-auto divide-y divide-surface-container divide-surface-container">
                {results.map((result, i) => (
                  <li key={result.slug}>
                    <button
                      type="button"
                      onClick={() => navigate(result.slug)}
                      className={`w-full text-left px-4 py-3.5 transition-colors ${
                        i === activeIndex
                          ? 'bg-surface-container'
                          : 'hover:bg-background hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="font-headline font-semibold text-sm text-on-surface">
                          <Highlight text={result.title} query={query} />
                        </span>
                        <span className="text-xs text-on-surface-variant shrink-0">
                          {t('day')} {result.dayNumber} · {formatDate(result.date)}
                        </span>
                      </div>
                      {result.excerpt && (
                        <p className="text-xs text-on-surface-variant text-on-surface-variant line-clamp-2 leading-relaxed">
                          <Highlight text={result.excerpt} query={query} />
                        </p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Empty state */}
            {showEmpty && (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-on-surface-variant">
                  {t('noResults')}{' '}
                  <span className="font-medium text-on-surface">&bdquo;{query}&ldquo;</span>
                </p>
              </div>
            )}

            {/* Idle hint */}
            {!loading && query.trim().length < 2 && (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-on-surface-variant">{t('minChars')}</p>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  )
}
