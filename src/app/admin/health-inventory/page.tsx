export const revalidate = 300 // 5-Minuten Cache

import { getHealthInventory, CATEGORY_ORDER, type AttributeStats, type HealthCategory } from '@/lib/health-inventory'

function formatDate(date: Date | null): string {
  if (!date) return '—'
  return date.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatValue(value: number | null, unit: string): string {
  if (value === null) return '—'
  if (unit === 'kg') return `${value.toFixed(1)} kg`
  if (unit === '%') return `${value.toFixed(1)} %`
  if (unit === 'km') return `${value.toFixed(2)} km`
  if (unit === 'Schritte') return value.toLocaleString('de-CH')
  return `${value} ${unit}`
}

function UsedBadge({ used, note }: { used: boolean; note?: string }) {
  if (used) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-label font-bold tracking-widest uppercase bg-movement-600/15 text-movement-400 border border-movement-600/20"
        title={note}
      >
        Im Dashboard
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-label font-bold tracking-widest uppercase bg-surface-container-high text-on-surface-variant border border-outline-variant/20">
      Nicht verwendet
    </span>
  )
}

function CategorySection({ category, attributes }: { category: HealthCategory; attributes: AttributeStats[] }) {
  if (attributes.length === 0) return null

  // Used attributes first, then by count descending
  const sorted = [...attributes].sort((a, b) => {
    if (a.usedInDashboard !== b.usedInDashboard) return a.usedInDashboard ? -1 : 1
    return b.count - a.count
  })

  return (
    <div>
      <h2 className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant mb-3">
        {category}
      </h2>
      <div className="overflow-x-auto rounded-xl border border-outline-variant/15">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant/10 bg-surface-container-high">
              <th className="text-left px-4 py-2.5 text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant whitespace-nowrap">
                Attribut
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant whitespace-nowrap">
                Datenpunkte
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant whitespace-nowrap">
                Letzter Wert
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant whitespace-nowrap">
                Letzter Eingang
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant whitespace-nowrap">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((attr, i) => (
              <tr
                key={attr.key}
                className={`border-b border-outline-variant/10 last:border-0 transition-colors hover:bg-surface-container-high/50 ${
                  i % 2 === 0 ? 'bg-surface-container' : 'bg-surface-container-low'
                }`}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-on-surface">{attr.displayName}</p>
                  <p className="text-xs text-on-surface-variant font-mono mt-0.5">{attr.key}</p>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-headline font-bold ${attr.count > 0 ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                    {attr.count > 0 ? attr.count.toLocaleString('de-CH') : '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-on-surface-variant">
                  {formatValue(attr.lastValue, attr.unit)}
                </td>
                <td className="px-4 py-3 text-right text-on-surface-variant whitespace-nowrap">
                  {formatDate(attr.lastDate)}
                </td>
                <td className="px-4 py-3 text-right">
                  <UsedBadge used={attr.usedInDashboard} note={attr.dashboardNote} />
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

  const usedCount = inventory.filter((a) => a.usedInDashboard).length
  const totalCount = inventory.length

  const byCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    attributes: inventory.filter((a) => a.category === cat),
  }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">Apple Health Inventar</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Alle empfangenen Metriken aus Apple Health Auto Export via{' '}
          <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded font-mono">
            /api/health-import
          </code>
        </p>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 p-4 bg-surface-container rounded-xl border border-outline-variant/15">
        <div className="text-center">
          <p className="text-2xl font-headline font-bold text-on-surface">{usedCount}</p>
          <p className="text-xs text-on-surface-variant">Im Dashboard</p>
        </div>
        <div className="h-8 w-px bg-outline-variant/20" />
        <div className="text-center">
          <p className="text-2xl font-headline font-bold text-on-surface-variant">{totalCount - usedCount}</p>
          <p className="text-xs text-on-surface-variant">Ungenutzt</p>
        </div>
        <div className="h-8 w-px bg-outline-variant/20" />
        <div className="text-center">
          <p className="text-2xl font-headline font-bold text-on-surface">{totalCount}</p>
          <p className="text-xs text-on-surface-variant">Gesamt</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-on-surface-variant">
            Datenquelle: <span className="text-on-surface font-medium">DailyMetrics</span>
          </p>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Rohdaten werden nicht gespeichert — nur geparste Tageswerte
          </p>
        </div>
      </div>

      {/* Category sections */}
      {byCategory.map(({ category, attributes }) => (
        <CategorySection key={category} category={category} attributes={attributes} />
      ))}

      {/* Context note */}
      <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/10 text-xs text-on-surface-variant space-y-1.5">
        <p className="font-semibold text-on-surface">Hinweise</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Die Apple Health Auto Export App sendet <strong>alle</strong> ausgewählten Metriken, aber nur
            7 Felder werden aktuell geparst und gespeichert (in{' '}
            <code className="font-mono">lib/apple-health.ts</code>).
          </li>
          <li>
            Fitbit-exklusive Felder (<code className="font-mono">bmi</code>,{' '}
            <code className="font-mono">activeMinutes</code>) werden hier nicht gezeigt.
          </li>
          <li>
            Neue Metriken hinzufügen: Parser in <code className="font-mono">parseHealthPayload()</code>{' '}
            erweitern + neues Feld in <code className="font-mono">DailyMetrics</code> via Migration.
          </li>
          <li>Seite wird alle 5 Minuten neu validiert.</li>
        </ul>
      </div>
    </div>
  )
}
