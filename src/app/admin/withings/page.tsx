import { prisma } from '@/lib/db'
import { WithingsSyncPanel } from '@/components/admin/WithingsSyncPanel'
import { buildWithingsAuthUrl, MEASURE_WEIGHT, MEASURE_FAT_RATIO } from '@/lib/withings'
import Link from 'next/link'

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('de-CH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function ConfigBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full flex-none ${ok ? 'bg-movement-500' : 'bg-red-400'}`} />
      <span className="text-sm text-on-surface">{label}</span>
      <span className={`text-xs font-medium ${ok ? 'text-movement-600 text-movement-400' : 'text-red-600 text-red-400'}`}>
        {ok ? 'Konfiguriert' : 'Fehlt'}
      </span>
    </div>
  )
}

interface DaySummary {
  date: string
  weight: number | null
  bodyFat: number | null
  measureCount: number
}

function summarizeMeasurements(
  rows: Array<{ date: Date; type: number; value: number }>,
): DaySummary[] {
  const byDate = new Map<string, DaySummary>()
  for (const row of rows) {
    const dateStr = row.date.toISOString().slice(0, 10)
    const day = byDate.get(dateStr) ?? { date: dateStr, weight: null, bodyFat: null, measureCount: 0 }
    day.measureCount++
    if (row.type === MEASURE_WEIGHT) day.weight = row.value
    if (row.type === MEASURE_FAT_RATIO) day.bodyFat = row.value
    byDate.set(dateStr, day)
  }
  return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date))
}

export default async function WithingsPage({
  searchParams,
}: {
  searchParams: { authorized?: string; error?: string }
}) {
  const hasClientId = !!process.env.WITHINGS_CLIENT_ID
  const hasClientSecret = !!process.env.WITHINGS_CLIENT_SECRET

  // Tokens can come from DB (preferred) or env (fallback)
  const [dbAccessToken, dbRefreshToken] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: 'withings.accessToken' } }),
    prisma.appSetting.findUnique({ where: { key: 'withings.refreshToken' } }),
  ])
  const hasDbTokens = !!(dbAccessToken && dbRefreshToken)
  const hasEnvTokens = !!(process.env.WITHINGS_ACCESS_TOKEN && process.env.WITHINGS_REFRESH_TOKEN)
  const isConfigured = hasClientId && hasClientSecret && (hasDbTokens || hasEnvTokens)

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://project365.dom42.ch'
  const withingsAuthUrl = buildWithingsAuthUrl(`${baseUrl}/api/withings/callback`, 'withings')

  const [recentMeasurements, syncLog] = await Promise.all([
    prisma.withingsMeasurement.findMany({
      orderBy: { measuredAt: 'desc' },
      take: 400,
      select: { date: true, type: true, value: true },
    }),
    prisma.withingsSyncLog.findMany({
      orderBy: { syncedAt: 'desc' },
      take: 40,
    }),
  ])

  const recentDays = summarizeMeasurements(recentMeasurements).slice(0, 10)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">Withings Sync</h1>
        <p className="text-on-surface-variant text-sm">
          Body-Scan-Messwerte manuell synchronisieren oder historische Daten nachfüllen.
        </p>
      </div>

      {searchParams.authorized === '1' && (
        <div className="bg-movement-100 bg-movement-900/20 border border-movement-200 border-movement-800 rounded-xl px-4 py-3 text-sm text-movement-700 text-movement-400">
          Withings erfolgreich autorisiert. Tokens wurden in der Datenbank gespeichert.
        </div>
      )}

      {searchParams.error && (
        <div className="bg-red-50 bg-red-900/20 border border-red-200 border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 text-red-400">
          Autorisierung fehlgeschlagen: <code>{searchParams.error}</code>
        </div>
      )}

      <section>
        <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Konfiguration</h2>
        <div className="bg-surface-container rounded-2xl border border-surface-container-high p-5 space-y-3">
          <ConfigBadge ok={hasClientId} label="WITHINGS_CLIENT_ID" />
          <ConfigBadge ok={hasClientSecret} label="WITHINGS_CLIENT_SECRET" />
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-none ${(hasDbTokens || hasEnvTokens) ? 'bg-movement-500' : 'bg-red-400'}`} />
            <span className="text-sm text-on-surface">OAuth Tokens</span>
            <span className={`text-xs font-medium ${(hasDbTokens || hasEnvTokens) ? 'text-movement-600 text-movement-400' : 'text-red-600 text-red-400'}`}>
              {hasDbTokens ? 'In DB gespeichert' : hasEnvTokens ? 'Aus .env (noch nicht persistiert)' : 'Fehlen'}
            </span>
          </div>
          <div className="border-t border-surface-container pt-3">
            <Link
              href={withingsAuthUrl}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium transition-colors"
            >
              {isConfigured ? '↺ Re-Authorize' : '+ Withings autorisieren'}
            </Link>
            <p className="mt-2 text-xs text-on-surface-variant">
              Öffnet Withings OAuth — nach Bestätigung werden Tokens automatisch in der DB gespeichert.
              Die Redirect-URL <code className="text-on-surface-variant">{baseUrl}/api/withings/callback</code> muss in der Withings-App registriert sein.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Manueller Sync</h2>
        <WithingsSyncPanel />
      </section>

      <section>
        <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Sync Log</h2>
        {syncLog.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Noch keine Sync-Ausführungen protokolliert.</p>
        ) : (
          <div className="bg-surface-container rounded-2xl border border-surface-container-high overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-container text-on-surface-variant text-left">
                    <th className="px-4 py-3 font-medium">Zeitpunkt</th>
                    <th className="px-4 py-3 font-medium">Trigger</th>
                    <th className="px-4 py-3 font-medium">Zeitraum</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Gewicht</th>
                    <th className="px-4 py-3 font-medium">Körperfett</th>
                    <th className="px-4 py-3 font-medium">Messwerte</th>
                    <th className="px-4 py-3 font-medium">Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  {syncLog.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-surface-container last:border-0 hover:bg-surface-container transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-on-surface-variant whitespace-nowrap">
                        {row.syncedAt.toLocaleString('de-CH', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                          timeZone: 'Europe/Zurich',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-label font-bold tracking-widest uppercase text-xs px-1.5 py-0.5 rounded ${
                          row.triggeredBy === 'CRON'
                            ? 'bg-surface-container-high text-on-surface-variant'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {row.triggeredBy}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-on-surface whitespace-nowrap">{row.syncDate}</td>
                      <td className="px-4 py-3">
                        {row.status === 'SUCCESS' ? (
                          <span className="text-movement-400">✓ OK</span>
                        ) : (
                          <span className="text-error" title={row.errorMessage ?? undefined}>✗ Fehler</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-on-surface">{row.weight != null ? `${row.weight} kg` : '—'}</td>
                      <td className="px-4 py-3 text-on-surface">{row.bodyFat != null ? `${row.bodyFat}%` : '—'}</td>
                      <td className="px-4 py-3 text-on-surface">{row.measureCount != null ? row.measureCount : '—'}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{row.tokensRefreshed ? '↺' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {recentDays.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Letzte Withings-Daten</h2>
          <div className="bg-surface-container rounded-2xl border border-surface-container-high overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-container text-on-surface-variant text-left">
                    <th className="px-4 py-3 font-medium">Datum</th>
                    <th className="px-4 py-3 font-medium">Gewicht</th>
                    <th className="px-4 py-3 font-medium">Körperfett</th>
                    <th className="px-4 py-3 font-medium">Messwerte gesamt</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDays.map((row) => (
                    <tr
                      key={row.date}
                      className="border-b border-surface-container last:border-0 hover:bg-surface-container transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-on-surface-variant">{formatDate(row.date)}</td>
                      <td className="px-4 py-3 text-on-surface">{row.weight != null ? `${row.weight} kg` : '—'}</td>
                      <td className="px-4 py-3 text-on-surface">{row.bodyFat != null ? `${row.bodyFat}%` : '—'}</td>
                      <td className="px-4 py-3 text-on-surface">{row.measureCount}</td>
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
