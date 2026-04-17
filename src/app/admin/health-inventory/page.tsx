export const revalidate = 300 // 5-Minuten Cache

import { getHealthInventory, CATEGORY_ORDER, type InventoryRow } from '@/lib/health-inventory'

function formatLastDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}.${m}.${y}`
}

function formatLastReceived(date: Date): string {
  return date.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatValue(value: number | null, unit: string): string {
  if (value === null) return '—'
  if (unit === 'kg') return value.toFixed(1)
  if (unit === '%') return value.toFixed(1)
  if (unit === 'km' || unit === 'mi') return value.toFixed(2)
  if (Number.isInteger(value)) return value.toLocaleString('de-CH')
  return value.toFixed(2)
}

function StatusBadge({ row }: { row: InventoryRow }) {
  if (row.usedInDashboard) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-label font-bold tracking-widest uppercase bg-movement-600/15 text-movement-400 border border-movement-600/20 whitespace-nowrap"
        title={row.dashboardNote}
      >
        Im Dashboard
      </span>
    )
  }
  if (row.mappedToDb) {
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

  const sorted = [...rows].sort((a, b) => {
    if (a.usedInDashboard !== b.usedInDashboard) return a.usedInDashboard ? -1 : 1
    if (!!a.mappedToDb !== !!b.mappedToDb) return a.mappedToDb ? -1 : 1
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
              <th className="text-right px-4 py-2.5 text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant whitespace-nowrap">Letzter Wert</th>
              <th className="text-right px-4 py-2.5 text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant whitespace-nowrap">Datum</th>
              <th className="text-right px-4 py-2.5 text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant whitespace-nowrap">Letzter Import</th>
              <th className="text-right px-4 py-2.5 text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr
                key={row.metricName}
                className={`border-b border-outline-variant/10 last:border-0 transition-colors hover:bg-surface-container-high/50 ${
                  i % 2 === 0 ? 'bg-surface-container' : 'bg-surface-container-low'
                }`}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-on-surface">{row.displayName}</p>
                  <p className="text-xs text-on-surface-variant font-mono mt-0.5 opacity-60">{row.metricName}</p>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-headline font-bold text-on-surface">
                    {row.sampleCount.toLocaleString('de-CH')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-on-surface-variant whitespace-nowrap">
                  {formatValue(row.lastValue, row.unit)}
                  {row.lastValue !== null && (
                    <span className="ml-1 text-xs opacity-60">{row.unit}</span>
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

export default async function HealthInventoryPage() {
  const inventory = await getHealthInventory()

  const usedCount = inventory.filter((r) => r.usedInDashboard).length
  const storedCount = inventory.filter((r) => r.mappedToDb && !r.usedInDashboard).length
  const unusedCount = inventory.filter((r) => !r.mappedToDb).length
  const totalCount = inventory.length

  const byCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    rows: inventory.filter((r) => r.category === cat),
  })).filter((g) => g.rows.length > 0)

  // Metrics not in our static map
  const knownCategories = new Set(CATEGORY_ORDER)
  const otherRows = inventory.filter((r) => !knownCategories.has(r.category) || r.category === 'Sonstiges')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">Apple Health Inventar</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Alle via{' '}
          <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded font-mono">/api/health-import</code>{' '}
          empfangenen Metriken. Wird bei jedem App-Sync aktualisiert.
        </p>
      </div>

      {totalCount === 0 ? (
        <div className="p-8 text-center bg-surface-container rounded-xl border border-outline-variant/15">
          <p className="text-on-surface-variant text-sm">Noch keine Daten empfangen.</p>
          <p className="text-on-surface-variant text-xs mt-2">
            Sobald die Apple Health Auto Export App das nächste Mal synchronisiert, erscheinen hier alle Metriken.
          </p>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Gesamt empfangen', value: totalCount, color: 'text-on-surface' },
              { label: 'Im Dashboard',     value: usedCount,   color: 'text-movement-400' },
              { label: 'Gespeichert',      value: storedCount, color: 'text-primary' },
              { label: 'Ungenutzt',        value: unusedCount, color: 'text-on-surface-variant' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-4 bg-surface-container rounded-xl border border-outline-variant/15 text-center">
                <p className={`text-2xl font-headline font-bold ${color}`}>{value}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Category sections */}
          {byCategory.map(({ category, rows }) => (
            <CategorySection key={category} category={category} rows={rows} />
          ))}

          {/* Fallback: unbekannte Kategorien */}
          {otherRows.length > 0 && (
            <CategorySection category="Sonstiges" rows={otherRows} />
          )}
        </>
      )}

      {/* Context note */}
      <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/10 text-xs text-on-surface-variant space-y-1.5">
        <p className="font-semibold text-on-surface">Status-Legende</p>
        <ul className="space-y-1">
          <li><span className="text-movement-400 font-semibold">Im Dashboard</span> — Wird auf der öffentlichen Startseite angezeigt</li>
          <li><span className="text-primary font-semibold">Gespeichert</span> — In DailyMetrics gespeichert, aber noch nicht öffentlich sichtbar</li>
          <li><span className="text-on-surface-variant font-semibold">Nicht verwendet</span> — Wird empfangen, aber nicht geparst oder gespeichert</li>
        </ul>
        <p className="mt-2 pt-2 border-t border-outline-variant/10">
          Neue Metriken aktivieren: Parser in <code className="font-mono">lib/apple-health.ts → parseHealthPayload()</code> erweitern + ggf. Migration für neues <code className="font-mono">DailyMetrics</code>-Feld.
        </p>
      </div>
    </div>
  )
}
