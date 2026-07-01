'use client'

import { useMemo, useState } from 'react'
import { CATEGORY_ORDER, type InventoryRow, type InventorySource } from '@/lib/inventory'

// Maps raw units to readable display units
const UNIT_DISPLAY: Record<string, string> = {
  'count':          'Schritte',
  'count/min':      'S/min',
  'kcal':           'kcal',
  'Cal':            'kcal',
  'km':             'km',
  'mi':             'mi',
  'kg':             'kg',
  '%':              '%',
  'bpm':            'bpm',
  'ms':             'ms',
  'hr':             'h',
  'min':            'min',
  'mmHg':           'mmHg',
  'dBASPL':         'dB',
  'mL/kg/min':      'ml/kg/min',
  'ml/min/kg':      'ml/min/kg',
  'degC':           '°C',
  '°C':             '°C',
  'lux':            'lux',
  'W':              'W',
  'm/s':            'm/s',
  'm':              'm',
  'cm':             'cm',
  'L':              'L',
  'mg/dL':          'mg/dL',
  'IU':             'IE',
  'Jahre':          'Jahre',
}

function displayUnit(rawUnit: string): string {
  return UNIT_DISPLAY[rawUnit] ?? rawUnit
}

function formatValue(value: number | null, rawUnit: string): string {
  if (value === null) return '—'
  const integerUnits = ['count', 'count/min']
  if (integerUnits.includes(rawUnit)) return Math.round(value).toLocaleString('de-CH')
  if (rawUnit === 'kg' || rawUnit === '%') return value.toFixed(1)
  if (rawUnit === 'km' || rawUnit === 'mi' || rawUnit === 'm') return value.toFixed(2)
  if (rawUnit === 'hr') return value.toFixed(1)
  if (rawUnit === 'ms') return Math.round(value).toLocaleString('de-CH')
  if (Number.isInteger(value)) return value.toLocaleString('de-CH')
  return value.toFixed(1)
}

function formatLastDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}.${m}.${y}`
}

function formatLastReceived(date: Date): string {
  return date.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function StatusBadge({ row }: { row: InventoryRow }) {
  if (row.status === 'DASHBOARD') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-label font-bold tracking-widest uppercase bg-movement-600/15 text-movement-400 border border-movement-600/20 whitespace-nowrap"
        title={row.dashboardNote}
      >
        Im Dashboard
      </span>
    )
  }
  if (row.status === 'STORED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-label font-bold tracking-widest uppercase bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
        Gespeichert
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-label font-bold tracking-widest uppercase bg-surface-container-highest text-on-surface-variant border border-outline-variant/20 whitespace-nowrap">
      Nicht verwendet
    </span>
  )
}

function CategorySection({ category, rows }: { category: string; rows: InventoryRow[] }) {
  if (rows.length === 0) return null

  const statusRank = (r: InventoryRow) => (r.status === 'DASHBOARD' ? 0 : r.status === 'STORED' ? 1 : 2)
  const sorted = [...rows].sort((a, b) => {
    if (statusRank(a) !== statusRank(b)) return statusRank(a) - statusRank(b)
    return b.sampleCount - a.sampleCount
  })

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant">
          {category}
        </h2>
        <span className="text-xs text-on-surface-variant opacity-50">{rows.length}</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-outline-variant/15">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-outline-variant/10 bg-surface-container-high">
              <th className="text-left px-4 py-2.5 text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant">Attribut</th>
              <th className="text-right px-4 py-2.5 text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant whitespace-nowrap">Datenpunkte</th>
              <th className="text-right px-4 py-2.5 text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant whitespace-nowrap" title="Letzter Einzelmesswert (kein Tageswert)">Letzter Messwert</th>
              <th className="text-right px-4 py-2.5 text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant whitespace-nowrap">Datum</th>
              <th className="text-right px-4 py-2.5 text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant whitespace-nowrap">Letzter Import</th>
              <th className="text-right px-4 py-2.5 text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr
                key={`${row.source}:${row.key}`}
                className={`border-b border-outline-variant/10 last:border-0 transition-colors hover:bg-surface-container-high/50 ${
                  i % 2 === 0 ? 'bg-surface-container' : 'bg-surface-container-low'
                }`}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-on-surface">{row.displayName}</p>
                  <p className="text-xs text-on-surface-variant font-mono mt-0.5 opacity-60">{row.key}</p>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-headline font-bold text-on-surface">
                    {row.sampleCount.toLocaleString('de-CH')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-on-surface-variant whitespace-nowrap">
                  {formatValue(row.lastValue, row.unit)}
                  {row.lastValue !== null && row.unit !== '' && (
                    <span className="ml-1 text-xs opacity-60">{displayUnit(row.unit)}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-on-surface-variant whitespace-nowrap text-xs">
                  {formatLastDate(row.lastValueDate)}
                </td>
                <td className="px-4 py-3 text-right text-on-surface-variant whitespace-nowrap text-xs">
                  {formatLastReceived(row.lastReceivedAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <StatusBadge row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const ALL = '__all__'

export function InventoryBrowser({
  rows,
  sources,
}: {
  rows: InventoryRow[]
  sources: InventorySource[]
}) {
  // Only offer tabs for sources that actually have data.
  const availableSources = useMemo(
    () => sources.filter((s) => rows.some((r) => r.source === s.id)),
    [rows, sources],
  )
  const [active, setActive] = useState<string>(ALL)

  const filtered = useMemo(
    () => (active === ALL ? rows : rows.filter((r) => r.source === active)),
    [rows, active],
  )

  const stats = useMemo(
    () => ({
      total: filtered.length,
      dashboard: filtered.filter((r) => r.status === 'DASHBOARD').length,
      stored: filtered.filter((r) => r.status === 'STORED').length,
      unused: filtered.filter((r) => r.status === 'UNUSED').length,
    }),
    [filtered],
  )

  // Categories present in the filtered set, ordered by CATEGORY_ORDER (unknowns last).
  const categories = useMemo(() => {
    const present = Array.from(new Set(filtered.map((r) => r.category)))
    return present.sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a)
      const ib = CATEGORY_ORDER.indexOf(b)
      return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib)
    })
  }, [filtered])

  const tabs = [{ id: ALL, label: 'Alle' }, ...availableSources]

  return (
    <div className="space-y-6">
      {/* Source tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              active === t.id
                ? 'bg-surface-container-highest text-on-surface'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            {t.label}
            <span className="ml-2 text-xs opacity-60">
              {t.id === ALL ? rows.length : rows.filter((r) => r.source === t.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Gesamt', value: stats.total, color: 'text-on-surface' },
          { label: 'Im Dashboard', value: stats.dashboard, color: 'text-movement-400' },
          { label: 'Gespeichert', value: stats.stored, color: 'text-primary' },
          { label: 'Ungenutzt', value: stats.unused, color: 'text-on-surface-variant' },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-4 bg-surface-container rounded-xl border border-outline-variant/15 text-center">
            <p className={`text-2xl font-headline font-bold ${color}`}>{value}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Category sections */}
      {categories.map((category) => (
        <CategorySection
          key={category}
          category={category}
          rows={filtered.filter((r) => r.category === category)}
        />
      ))}
    </div>
  )
}
