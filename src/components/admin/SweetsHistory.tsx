'use client'

import { useTransition, useState } from 'react'
import { setSweetsConsumedForDate } from '@/app/admin/quick-log/actions'

interface SweetsEntry {
  date: string // YYYY-MM-DD
  consumed: boolean
}

interface SweetsHistoryProps {
  entries: SweetsEntry[]
  todayStr: string
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function SweetsHistory({ entries, todayStr }: SweetsHistoryProps) {
  const [isPending, startTransition] = useTransition()
  const [localEntries, setLocalEntries] = useState<SweetsEntry[]>(entries)
  const [error, setError] = useState<string | null>(null)

  // Build a map for quick lookup
  const entryMap = new Map(localEntries.map((e) => [e.date, e.consumed]))

  // Generate last 13 days (excluding today)
  const days: string[] = []
  for (let i = 1; i <= 13; i++) {
    const [y, m, d] = todayStr.split('-').map(Number)
    const date = new Date(y, m - 1, d - i)
    days.push(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    )
  }

  function handleSet(dateStr: string, value: boolean | null) {
    setError(null)
    setLocalEntries((prev) => {
      if (value === null) return prev.filter((e) => e.date !== dateStr)
      const exists = prev.find((e) => e.date === dateStr)
      if (exists) return prev.map((e) => (e.date === dateStr ? { ...e, consumed: value } : e))
      return [...prev, { date: dateStr, consumed: value }]
    })
    startTransition(async () => {
      const result = await setSweetsConsumedForDate(dateStr, value)
      if (result.error) setError(result.error)
    })
  }

  if (days.length === 0) return null

  return (
    <div>
      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">
        Süssigkeiten Verlauf
      </p>
      <div className="space-y-1">
        {days.map((dateStr) => {
          const consumed = entryMap.get(dateStr)
          const hasEntry = consumed !== undefined
          return (
            <div
              key={dateStr}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container"
            >
              <span className="text-sm text-on-surface-variant w-28 shrink-0">
                {formatDate(dateStr)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSet(dateStr, false)}
                  disabled={isPending}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${
                    hasEntry && consumed === false
                      ? 'bg-movement-400/20 border border-movement-400/50 text-movement-300'
                      : 'bg-surface-container-high border border-surface-container-high text-on-surface-variant'
                  }`}
                >
                  ✅ Keine
                </button>
                <button
                  onClick={() => handleSet(dateStr, true)}
                  disabled={isPending}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${
                    hasEntry && consumed === true
                      ? 'bg-error/20 border border-error/50 text-error'
                      : 'bg-surface-container-high border border-surface-container-high text-on-surface-variant'
                  }`}
                >
                  🍫 Ja
                </button>
                {hasEntry && (
                  <button
                    onClick={() => handleSet(dateStr, null)}
                    disabled={isPending}
                    className="text-on-surface-variant hover:text-error transition-colors disabled:opacity-40 ml-1"
                    aria-label="Eintrag löschen"
                  >
                    <span
                      className="material-symbols-outlined text-base"
                      style={{ fontVariationSettings: "'FILL' 0" }}
                    >
                      delete
                    </span>
                  </button>
                )}
                {!hasEntry && (
                  <span className="text-xs text-on-surface-variant/40 ml-1 w-5" />
                )}
              </div>
            </div>
          )
        })}
      </div>
      {error && <p className="text-xs text-error mt-2">{error}</p>}
    </div>
  )
}
