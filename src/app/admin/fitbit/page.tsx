export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { FitbitSyncPanel } from '@/components/admin/FitbitSyncPanel'

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-CH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function ConfigBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-2 h-2 rounded-full flex-none ${ok ? 'bg-movement-500' : 'bg-red-400'}`}
      />
      <span className="text-sm text-[#2d2926] dark:text-[#e8e4dc]">{label}</span>
      <span className={`text-xs font-medium ${ok ? 'text-movement-600 dark:text-movement-400' : 'text-red-600 dark:text-red-400'}`}>
        {ok ? 'Konfiguriert' : 'Fehlt'}
      </span>
    </div>
  )
}

export default async function FitbitPage() {
  const hasClientId = !!process.env.FITBIT_CLIENT_ID
  const hasClientSecret = !!process.env.FITBIT_CLIENT_SECRET
  const hasAccessToken = !!process.env.FITBIT_ACCESS_TOKEN
  const hasRefreshToken = !!process.env.FITBIT_REFRESH_TOKEN
  const isConfigured = hasClientId && hasClientSecret && hasAccessToken && hasRefreshToken

  const recentFitbitMetrics = await prisma.dailyMetrics.findMany({
    where: { source: 'FITBIT' },
    orderBy: { date: 'desc' },
    take: 10,
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#1a1714] dark:text-[#faf9f7] mb-1">Fitbit Sync</h1>
        <p className="text-sand-500 text-sm">
          Metriken manuell synchronisieren oder historische Daten nachfüllen.
        </p>
      </div>

      <section>
        <h2 className="text-xs font-semibold text-sand-400 uppercase tracking-wide mb-3">Konfiguration</h2>
        <div className="bg-white dark:bg-[#2d2926] rounded-2xl border border-sand-200 dark:border-[#4a4540] p-5 space-y-3">
          <ConfigBadge ok={hasClientId} label="FITBIT_CLIENT_ID" />
          <ConfigBadge ok={hasClientSecret} label="FITBIT_CLIENT_SECRET" />
          <ConfigBadge ok={hasAccessToken} label="FITBIT_ACCESS_TOKEN" />
          <ConfigBadge ok={hasRefreshToken} label="FITBIT_REFRESH_TOKEN" />
          {!isConfigured && (
            <p className="mt-3 text-xs text-sand-500 border-t border-sand-100 dark:border-[#3a3531] pt-3">
              Fehlende Werte in <code className="text-[#2d2926] dark:text-[#e8e4dc]">.env.local</code> ergänzen.
              Tokens erhältst du via Fitbit Developer Portal → OAuth 2.0 Authorization Code Flow.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-sand-400 uppercase tracking-wide mb-3">Manueller Sync</h2>
        <FitbitSyncPanel />
      </section>

      {recentFitbitMetrics.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-sand-400 uppercase tracking-wide mb-3">Letzte Fitbit-Daten</h2>
          <div className="bg-white dark:bg-[#2d2926] rounded-2xl border border-sand-200 dark:border-[#4a4540] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-sand-100 dark:border-[#3a3531] text-sand-500 text-left">
                    <th className="px-4 py-3 font-medium">Datum</th>
                    <th className="px-4 py-3 font-medium">Gewicht</th>
                    <th className="px-4 py-3 font-medium">Körperfett</th>
                    <th className="px-4 py-3 font-medium">Schritte</th>
                    <th className="px-4 py-3 font-medium">Aktiv</th>
                    <th className="px-4 py-3 font-medium">HR</th>
                    <th className="px-4 py-3 font-medium">Distanz</th>
                  </tr>
                </thead>
                <tbody>
                  {recentFitbitMetrics.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-sand-100 dark:border-[#3a3531] last:border-0 hover:bg-sand-50 dark:hover:bg-[#3a3531] transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-sand-500">{formatDate(row.date)}</td>
                      <td className="px-4 py-3 text-[#2d2926] dark:text-[#e8e4dc]">{row.weight != null ? `${row.weight} kg` : '—'}</td>
                      <td className="px-4 py-3 text-[#2d2926] dark:text-[#e8e4dc]">{row.bodyFat != null ? `${row.bodyFat}%` : '—'}</td>
                      <td className="px-4 py-3 text-[#2d2926] dark:text-[#e8e4dc]">{row.steps != null ? row.steps.toLocaleString('de-CH') : '—'}</td>
                      <td className="px-4 py-3 text-[#2d2926] dark:text-[#e8e4dc]">{row.activeMinutes != null ? `${row.activeMinutes} min` : '—'}</td>
                      <td className="px-4 py-3 text-[#2d2926] dark:text-[#e8e4dc]">{row.restingHR != null ? `${row.restingHR} bpm` : '—'}</td>
                      <td className="px-4 py-3 text-[#2d2926] dark:text-[#e8e4dc]">{row.distance != null ? `${row.distance} km` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
