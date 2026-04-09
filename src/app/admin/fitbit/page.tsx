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
      <span className="text-sm text-ctp-text">{label}</span>
      <span className={`text-xs font-medium ${ok ? 'text-movement-600 dark:text-movement-400' : 'text-red-600 dark:text-red-400'}`}>
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
        <h1 className="font-display text-2xl font-bold text-ctp-text mb-1">Fitbit Sync</h1>
        <p className="text-ctp-subtext1 text-sm">
          Metriken manuell synchronisieren oder historische Daten nachfüllen.
        </p>
      </div>

      {searchParams.authorized === '1' && (
        <div className="bg-movement-100 dark:bg-movement-900/20 border border-movement-200 dark:border-movement-800 rounded-xl px-4 py-3 text-sm text-movement-700 dark:text-movement-400">
          Fitbit erfolgreich autorisiert. Tokens wurden in der Datenbank gespeichert.
        </div>
      )}

      {searchParams.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
          Autorisierung fehlgeschlagen: <code>{searchParams.error}</code>
        </div>
      )}

      <section>
        <h2 className="text-xs font-semibold text-ctp-subtext0 uppercase tracking-wide mb-3">Konfiguration</h2>
        <div className="bg-ctp-base rounded-2xl border border-ctp-surface1 p-5 space-y-3">
          <ConfigBadge ok={hasClientId} label="FITBIT_CLIENT_ID" />
          <ConfigBadge ok={hasClientSecret} label="FITBIT_CLIENT_SECRET" />
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-none ${(hasDbTokens || hasEnvTokens) ? 'bg-movement-500' : 'bg-red-400'}`} />
            <span className="text-sm text-ctp-text">OAuth Tokens</span>
            <span className={`text-xs font-medium ${(hasDbTokens || hasEnvTokens) ? 'text-movement-600 dark:text-movement-400' : 'text-red-600 dark:text-red-400'}`}>
              {hasDbTokens ? 'In DB gespeichert' : hasEnvTokens ? 'Aus .env (noch nicht persistiert)' : 'Fehlen'}
            </span>
          </div>
          <div className="border-t border-ctp-surface0 pt-3">
            <Link
              href={fitbitAuthUrl}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ctp-surface0 hover:bg-ctp-surface1 text-ctp-text text-xs font-medium transition-colors"
            >
              {isConfigured ? '↺ Re-Authorize' : '+ Fitbit autorisieren'}
            </Link>
            <p className="mt-2 text-xs text-ctp-overlay1">
              Öffnet Fitbit OAuth — nach Bestätigung werden Tokens automatisch in der DB gespeichert.
              Die Redirect-URL <code className="text-ctp-subtext1">{baseUrl}/api/fitbit/callback</code> muss in der Fitbit App registriert sein.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-ctp-subtext0 uppercase tracking-wide mb-3">Manueller Sync</h2>
        <FitbitSyncPanel />
      </section>

      {recentFitbitMetrics.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-ctp-subtext0 uppercase tracking-wide mb-3">Letzte Fitbit-Daten</h2>
          <div className="bg-ctp-base rounded-2xl border border-ctp-surface1 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-ctp-surface0 text-ctp-subtext1 text-left">
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
                      className="border-b border-ctp-surface0 last:border-0 hover:bg-ctp-surface0 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-ctp-subtext1">{formatDate(row.date)}</td>
                      <td className="px-4 py-3 text-ctp-text">{row.weight != null ? `${row.weight} kg` : '—'}</td>
                      <td className="px-4 py-3 text-ctp-text">{row.bodyFat != null ? `${row.bodyFat}%` : '—'}</td>
                      <td className="px-4 py-3 text-ctp-text">{row.steps != null ? row.steps.toLocaleString('de-CH') : '—'}</td>
                      <td className="px-4 py-3 text-ctp-text">{row.activeMinutes != null ? `${row.activeMinutes} min` : '—'}</td>
                      <td className="px-4 py-3 text-ctp-text">{row.restingHR != null ? `${row.restingHR} bpm` : '—'}</td>
                      <td className="px-4 py-3 text-ctp-text">{row.distance != null ? `${row.distance} km` : '—'}</td>
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
