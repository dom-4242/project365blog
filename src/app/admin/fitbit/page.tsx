import { prisma } from '@/lib/db'
import { FitbitSyncPanel } from '@/components/admin/FitbitSyncPanel'
import Link from 'next/link'

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-CH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function ConfigBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-2 h-2 rounded-full flex-none ${ok ? 'bg-movement-500' : 'bg-red-400'}`}
      />
      <span className="text-sm text-on-surface">{label}</span>
      <span className={`text-xs font-medium ${ok ? 'text-movement-600 text-movement-400' : 'text-red-600 text-red-400'}`}>
        {ok ? 'Konfiguriert' : 'Fehlt'}
      </span>
    </div>
  )
}

function buildFitbitAuthUrl(baseUrl: string): string {
  const clientId = process.env.FITBIT_CLIENT_ID ?? ''
  const redirectUri = `${baseUrl}/api/fitbit/callback`
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: 'weight activity heartrate sleep',
    redirect_uri: redirectUri,
  })
  return `https://www.fitbit.com/oauth2/authorize?${params}`
}

export default async function FitbitPage({
  searchParams,
}: {
  searchParams: { authorized?: string; error?: string }
}) {
  const hasClientId = !!process.env.FITBIT_CLIENT_ID
  const hasClientSecret = !!process.env.FITBIT_CLIENT_SECRET

  // Tokens can come from DB (preferred) or env (fallback)
  const [dbAccessToken, dbRefreshToken] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: 'fitbit.accessToken' } }),
    prisma.appSetting.findUnique({ where: { key: 'fitbit.refreshToken' } }),
  ])
  const hasDbTokens = !!(dbAccessToken && dbRefreshToken)
  const hasEnvTokens = !!(process.env.FITBIT_ACCESS_TOKEN && process.env.FITBIT_REFRESH_TOKEN)
  const isConfigured = hasClientId && hasClientSecret && (hasDbTokens || hasEnvTokens)

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://project365.dom42.ch'
  const fitbitAuthUrl = buildFitbitAuthUrl(baseUrl)

  const recentFitbitMetrics = await prisma.dailyMetrics.findMany({
    where: { source: 'FITBIT' },
    orderBy: { date: 'desc' },
    take: 10,
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">Fitbit Sync</h1>
        <p className="text-on-surface-variant text-sm">
          Metriken manuell synchronisieren oder historische Daten nachfüllen.
        </p>
      </div>

      {searchParams.authorized === '1' && (
        <div className="bg-movement-100 bg-movement-900/20 border border-movement-200 border-movement-800 rounded-xl px-4 py-3 text-sm text-movement-700 text-movement-400">
          Fitbit erfolgreich autorisiert. Tokens wurden in der Datenbank gespeichert.
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
          <ConfigBadge ok={hasClientId} label="FITBIT_CLIENT_ID" />
          <ConfigBadge ok={hasClientSecret} label="FITBIT_CLIENT_SECRET" />
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-none ${(hasDbTokens || hasEnvTokens) ? 'bg-movement-500' : 'bg-red-400'}`} />
            <span className="text-sm text-on-surface">OAuth Tokens</span>
            <span className={`text-xs font-medium ${(hasDbTokens || hasEnvTokens) ? 'text-movement-600 text-movement-400' : 'text-red-600 text-red-400'}`}>
              {hasDbTokens ? 'In DB gespeichert' : hasEnvTokens ? 'Aus .env (noch nicht persistiert)' : 'Fehlen'}
            </span>
          </div>
          <div className="border-t border-surface-container pt-3">
            <Link
              href={fitbitAuthUrl}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium transition-colors"
            >
              {isConfigured ? '↺ Re-Authorize' : '+ Fitbit autorisieren'}
            </Link>
            <p className="mt-2 text-xs text-on-surface-variant">
              Öffnet Fitbit OAuth — nach Bestätigung werden Tokens automatisch in der DB gespeichert.
              Die Redirect-URL <code className="text-on-surface-variant">{baseUrl}/api/fitbit/callback</code> muss in der Fitbit App registriert sein.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Manueller Sync</h2>
        <FitbitSyncPanel />
      </section>

      {recentFitbitMetrics.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Letzte Fitbit-Daten</h2>
          <div className="bg-surface-container rounded-2xl border border-surface-container-high overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-container text-on-surface-variant text-left">
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
                      className="border-b border-surface-container last:border-0 hover:bg-surface-container transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-on-surface-variant">{formatDate(row.date)}</td>
                      <td className="px-4 py-3 text-on-surface">{row.weight != null ? `${row.weight} kg` : '—'}</td>
                      <td className="px-4 py-3 text-on-surface">{row.bodyFat != null ? `${row.bodyFat}%` : '—'}</td>
                      <td className="px-4 py-3 text-on-surface">{row.steps != null ? row.steps.toLocaleString('de-CH') : '—'}</td>
                      <td className="px-4 py-3 text-on-surface">{row.activeMinutes != null ? `${row.activeMinutes} min` : '—'}</td>
                      <td className="px-4 py-3 text-on-surface">{row.restingHR != null ? `${row.restingHR} bpm` : '—'}</td>
                      <td className="px-4 py-3 text-on-surface">{row.distance != null ? `${row.distance} km` : '—'}</td>
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
