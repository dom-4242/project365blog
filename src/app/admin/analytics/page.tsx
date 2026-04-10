import Link from 'next/link'
import { getAnalyticsSummary, getViewsPerDay, getTopPages, getTopReferrers } from '@/lib/analytics'
import { ViewsChart } from '@/components/admin/analytics/ViewsChart'

export const dynamic = 'force-dynamic'

interface StatCardProps {
  value: number | string
  label: string
  sub?: string
}

function StatCard({ value, label, sub }: StatCardProps) {
  return (
    <div className="bg-surface-container rounded-2xl border border-surface-container-high p-4 text-center">
      <p className="font-headline text-2xl font-bold text-on-surface">{value}</p>
      <p className="text-xs font-medium text-on-surface-variant mt-1">{label}</p>
      {sub && <p className="text-xs text-on-surface-variant mt-0.5">{sub}</p>}
    </div>
  )
}

const PERIODS = [
  { label: '7 Tage', value: '7' },
  { label: '30 Tage', value: '30' },
  { label: '90 Tage', value: '90' },
]

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { period?: string }
}) {
  const period = searchParams.period === '7' ? 7 : searchParams.period === '90' ? 90 : 30

  const [summary, viewsPerDay, topPages, topReferrers] = await Promise.all([
    getAnalyticsSummary(),
    getViewsPerDay(period),
    getTopPages(10, period),
    getTopReferrers(10, period),
  ])

  const maxPageViews = topPages[0]?.views ?? 1

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">Analytics</h1>
        <p className="text-on-surface-variant text-sm">Privacy-first · Kein Cookie · Keine IP-Speicherung</p>
      </div>

      {/* Summary Cards */}
      <section>
        <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Übersicht</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value={summary.viewsToday.toLocaleString('de-CH')} label="Aufrufe heute" sub={`${summary.sessionsToday} Besucher`} />
          <StatCard value={summary.viewsLast7d.toLocaleString('de-CH')} label="Aufrufe 7 Tage" sub={`${summary.sessionsLast7d} Besucher`} />
          <StatCard value={summary.viewsLast30d.toLocaleString('de-CH')} label="Aufrufe 30 Tage" sub={`${summary.sessionsLast30d} Besucher`} />
          <StatCard value={summary.viewsTotal.toLocaleString('de-CH')} label="Aufrufe gesamt" />
        </div>
      </section>

      {/* Chart */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Verlauf</h2>
          <div className="flex gap-1">
            {PERIODS.map(({ label, value }) => (
              <Link
                key={value}
                href={`/admin/analytics?period=${value}`}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  String(period) === value
                    ? 'bg-surface-container text-on-surface'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-background hover:bg-surface-container'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="bg-surface-container rounded-2xl border border-surface-container-high p-5">
          <ViewsChart data={viewsPerDay} />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <section>
          <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">
            Top Seiten <span className="normal-case font-normal">({period} Tage)</span>
          </h2>
          <div className="bg-surface-container rounded-2xl border border-surface-container-high divide-y divide-surface-container divide-surface-container">
            {topPages.length === 0 ? (
              <p className="px-5 py-4 text-sm text-on-surface-variant">Noch keine Daten</p>
            ) : (
              topPages.map(({ path, views, sessions }) => (
                <div key={path} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono text-on-surface truncate max-w-[60%]">
                      {path}
                    </span>
                    <span className="text-xs text-on-surface-variant shrink-0 ml-2">
                      {views} · {sessions} Bes.
                    </span>
                  </div>
                  <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(views / maxPageViews) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Referrers */}
        <section>
          <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">
            Referrer <span className="normal-case font-normal">({period} Tage)</span>
          </h2>
          <div className="bg-surface-container rounded-2xl border border-surface-container-high divide-y divide-surface-container divide-surface-container">
            {topReferrers.length === 0 ? (
              <p className="px-5 py-4 text-sm text-on-surface-variant">Noch keine Referrer-Daten</p>
            ) : (
              topReferrers.map(({ referrer, count }) => (
                <div key={referrer} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-xs font-mono text-on-surface truncate">
                    {referrer}
                  </span>
                  <span className="text-xs text-on-surface-variant shrink-0 ml-2">{count}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
