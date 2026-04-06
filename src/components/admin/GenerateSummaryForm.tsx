'use client'

import { useState, useTransition } from 'react'
import { generateSummaryAction } from '@/app/admin/summaries/actions'

const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

interface GenerateSummaryFormProps {
  defaultYear: number
  defaultMonth: number
}

export function GenerateSummaryForm({ defaultYear, defaultMonth }: GenerateSummaryFormProps) {
  const [year, setYear] = useState(defaultYear)
  const [month, setMonth] = useState(defaultMonth)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await generateSummaryAction(year, month)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-sand-500 font-medium">Monat</label>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          disabled={isPending}
          className="px-3 py-2 text-sm rounded-lg border border-sand-200 dark:border-[#4a4540] bg-white dark:bg-[#1a1714] text-[#1a1714] dark:text-[#faf9f7] focus:outline-none focus:ring-2 focus:ring-nutrition-400"
        >
          {MONTH_NAMES.map((name, i) => (
            <option key={i + 1} value={i + 1}>{name}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-sand-500 font-medium">Jahr</label>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          disabled={isPending}
          className="px-3 py-2 text-sm rounded-lg border border-sand-200 dark:border-[#4a4540] bg-white dark:bg-[#1a1714] text-[#1a1714] dark:text-[#faf9f7] focus:outline-none focus:ring-2 focus:ring-nutrition-400"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 text-sm font-medium rounded-lg bg-nutrition-600 text-white hover:bg-nutrition-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Generiert…' : 'Zusammenfassung generieren'}
      </button>
      {error && (
        <p className="w-full text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
      )}
    </form>
  )
}
