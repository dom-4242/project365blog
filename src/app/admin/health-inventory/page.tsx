export const revalidate = 300 // 5-Minuten Cache

import { getAllInventory, INVENTORY_SOURCES } from '@/lib/inventory'
import { InventoryBrowser } from '@/components/admin/InventoryBrowser'

export default async function HealthInventoryPage() {
  const inventory = await getAllInventory()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">Health Inventar</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Alle empfangenen Metriken über alle Datenquellen hinweg (Apple Health, Withings …).
          Nach Quelle filterbar; wird bei jedem Sync aktualisiert.
        </p>
      </div>

      {inventory.length === 0 ? (
        <div className="p-8 text-center bg-surface-container rounded-xl border border-outline-variant/15">
          <p className="text-on-surface-variant text-sm">Noch keine Daten empfangen.</p>
          <p className="text-on-surface-variant text-xs mt-2">
            Sobald eine Datenquelle das nächste Mal synchronisiert, erscheinen hier alle Metriken.
          </p>
        </div>
      ) : (
        <InventoryBrowser rows={inventory} sources={INVENTORY_SOURCES} />
      )}

      {/* Context note */}
      <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/10 text-xs text-on-surface-variant space-y-1.5">
        <p className="font-semibold text-on-surface">Status-Legende</p>
        <ul className="space-y-1">
          <li><span className="text-movement-400 font-semibold">Im Dashboard</span> — Wird auf der öffentlichen Startseite angezeigt</li>
          <li><span className="text-primary font-semibold">Gespeichert</span> — In der Datenbank gespeichert, aber (noch) nicht öffentlich sichtbar</li>
          <li><span className="text-on-surface-variant font-semibold">Nicht verwendet</span> — Wird empfangen, aber nicht geparst oder gespeichert</li>
        </ul>
        <p className="mt-2 pt-2 border-t border-outline-variant/10">
          Datenquellen: <span className="text-on-surface">{INVENTORY_SOURCES.map((s) => s.label).join(', ')}</span>.
          Neue Metrik aktivieren: im jeweiligen Quellen-Parser mappen (z.B.{' '}
          <code className="font-mono">lib/apple-health.ts</code> bzw.{' '}
          <code className="font-mono">lib/withings.ts</code>) und ggf. Migration für ein neues{' '}
          <code className="font-mono">DailyMetrics</code>-Feld.
        </p>
      </div>
    </div>
  )
}
