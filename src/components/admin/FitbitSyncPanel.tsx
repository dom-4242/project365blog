'use client'

import { useState, useTransition } from 'react'
import { syncDay, syncRange, type SyncActionResult } from '@/app/admin/fitbit/actions'
import type { FitbitSyncResult } from '@/lib/fitbit'

// =============================================
// Result row
// =============================================

function ResultRow({ r }: { r: FitbitSyncResult }) {
  return (
    <tr className="border-b border-surface-container last:border-0 text-xs">
      <td className="px-4 py-2.5 font-mono text-on-surface-variant">{r.date}</td>
      <td className="px-4 py-2.5 text-on-surface">{r.weight != null ? `${r.weight} kg` : '—'}</td>
      <td className="px-4 py-2.5 text-on-surface">{r.bodyFat != null ? `${r.bodyFat}%` : '—'}</td>
      <td className="px-4 py-2.5 text-on-surface">
        {r.activeMinutes != null ? `${r.activeMinutes} min` : '—'}
      </td>
      <td className="px-4 py-2.5 text-on-surface">
        {r.restingHR != null ? `${r.restingHR} bpm` : '—'}
      </td>
    </tr>
  )
}

function SyncResultDisplay({ outcome }: { outcome: SyncActionResult }) {
  return (
    <div className="mt-4 space-y-3">
      {outcome.error && (
        <div className="p-3 bg-red-50 bg-red-900/20 border border-red-200 border-red-800/40 rounded-lg text-sm text-red-700 text-red-400">
          {outcome.error}
          {outcome.rateLimitSeconds != null && (
            <span className="ml-1 text-red-500">
              (Retry in {Math.ceil(outcome.rateLimitSeconds / 60)} min)
            </span>
          )}
        </div>
      )}
      {outcome.tokensRefreshed && (
        <div className="p-3 bg-amber-50 bg-amber-900/20 border border-amber-200 border-amber-800/40 rounded-lg text-sm text-amber-700 text-amber-400">
          Tokens wurden erneuert — bitte <code>FITBIT_ACCESS_TOKEN</code> und{' '}
          <code>FITBIT_REFRESH_TOKEN</code> im Server-Log ablesen und in <code>.env</code>{' '}
          aktualisieren.
        </div>
      )}
      {outcome.results && outcome.results.length > 0 && !outcome.error && (
        <div className="p-3 bg-movement-100 bg-movement-600/10 border border-movement-200 border-movement-600/20 rounded-lg text-sm text-movement-700 text-movement-400">
          {outcome.results.length === 1 ? 'Sync erfolgreich.' : `${outcome.results.length} Tage synchronisiert.`}
        </div>
      )}
      {outcome.results && outcome.results.length > 0 && (
        <div className="bg-surface-container rounded-xl border border-surface-container-high overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-container text-on-surface-variant text-left">
                <th className="px-4 py-2.5 font-medium">Datum</th>
                <th className="px-4 py-2.5 font-medium">Gewicht</th>
                <th className="px-4 py-2.5 font-medium">Körperfett</th>
                <th className="px-4 py-2.5 font-medium">Aktiv</th>
                <th className="px-4 py-2.5 font-medium">HR</th>
              </tr>
            </thead>
            <tbody>
              {outcome.results.map((r) => (
                <ResultRow key={r.date} r={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// =============================================
// Single day sync panel
// =============================================

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayString() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function FitbitSyncPanel() {
  const [isPending, startTransition] = useTransition()
  const [singleDate, setSingleDate] = useState(yesterdayString())
  const [singleOutcome, setSingleOutcome] = useState<SyncActionResult | null>(null)

  const [startDate, setStartDate] = useState(yesterdayString())
  const [endDate, setEndDate] = useState(yesterdayString())
  const [rangeOutcome, setRangeOutcome] = useState<SyncActionResult | null>(null)

  function handleSingleSync() {
    setSingleOutcome(null)
    startTransition(async () => {
      const result = await syncDay(singleDate)
      setSingleOutcome(result)
    })
  }

  function handleRangeSync() {
    setRangeOutcome(null)
    startTransition(async () => {
      const result = await syncRange(startDate, endDate)
      setRangeOutcome(result)
    })
  }

  return (
    <div className="space-y-6">
      {/* Single day */}
      <div className="bg-surface-container rounded-2xl border border-surface-container-high p-5">
        <h3 className="font-display text-sm font-semibold text-on-surface mb-4">
          Einzelnen Tag synchronisieren
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">Datum</label>
            <input
              type="date"
              value={singleDate}
              max={todayString()}
              onChange={(e) => setSingleDate(e.target.value)}
              className="border border-surface-container-high rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-on-surface-variant bg-surface-container"
            />
          </div>
          <button
            type="button"
            onClick={handleSingleSync}
            disabled={isPending}
            className="px-4 py-2 bg-movement-600 text-white rounded-xl text-sm font-medium hover:bg-movement-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Synchronisiere…' : 'Sync starten'}
          </button>
        </div>
        {singleOutcome && <SyncResultDisplay outcome={singleOutcome} />}
      </div>

      {/* Date range backfill */}
      <div className="bg-surface-container rounded-2xl border border-surface-container-high p-5">
        <h3 className="font-display text-sm font-semibold text-on-surface mb-1">
          Zeitraum nachfüllen (Backfill)
        </h3>
        <p className="text-xs text-on-surface-variant mb-4">Maximal 30 Tage auf einmal.</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">Von</label>
            <input
              type="date"
              value={startDate}
              max={todayString()}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-surface-container-high rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-on-surface-variant bg-surface-container"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">Bis</label>
            <input
              type="date"
              value={endDate}
              max={todayString()}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-surface-container-high rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-on-surface-variant bg-surface-container"
            />
          </div>
          <button
            type="button"
            onClick={handleRangeSync}
            disabled={isPending}
            className="px-4 py-2 bg-movement-600 text-white rounded-xl text-sm font-medium hover:bg-movement-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Synchronisiere…' : 'Backfill starten'}
          </button>
        </div>
        {rangeOutcome && <SyncResultDisplay outcome={rangeOutcome} />}
      </div>
    </div>
  )
}
