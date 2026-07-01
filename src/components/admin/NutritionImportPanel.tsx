'use client'

import { useRef, useState, useTransition } from 'react'
import { importNutrition, type ImportResult } from '@/app/admin/nutrition-import/actions'

export function NutritionImportPanel() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<ImportResult | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setResult(null)
    startTransition(async () => {
      const res = await importNutrition(formData)
      setResult(res)
      if (res.summary) formRef.current?.reset()
      if (res.summary) setFileName(null)
    })
  }

  return (
    <div className="bg-surface-container rounded-2xl border border-surface-container-high p-5 space-y-4">
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">
            MFP Nutrition-CSV
          </label>
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            className="block text-sm text-on-surface-variant file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-surface-container-high file:text-on-surface hover:file:bg-surface-container-highest file:cursor-pointer"
          />
        </div>
        <button
          type="submit"
          disabled={isPending || !fileName}
          className="px-4 py-2 bg-movement-600 text-white rounded-xl text-sm font-medium hover:bg-movement-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Importiere…' : 'Import starten'}
        </button>
      </form>

      {result?.error && (
        <div className="p-3 bg-red-50 bg-red-900/20 border border-red-200 border-red-800/40 rounded-lg text-sm text-red-700 text-red-400">
          {result.error}
        </div>
      )}

      {result?.summary && (
        <div className="p-3 bg-movement-100 bg-movement-600/10 border border-movement-200 border-movement-600/20 rounded-lg text-sm text-movement-700 text-movement-400">
          Import erfolgreich: <strong>{result.summary.entries}</strong> Mahlzeiten-Einträge über{' '}
          <strong>{result.summary.days}</strong> Tage
          {result.summary.from && result.summary.to && (
            <> ({result.summary.from} – {result.summary.to})</>
          )}
          .
        </div>
      )}
    </div>
  )
}
