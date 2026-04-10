import Link from 'next/link'
import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDayNumber } from '@/lib/journal'
import { getProjectStartDate } from '@/lib/project-config'

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-CH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('de-CH', { month: 'short', day: 'numeric' })
}

// =============================================
// Status card
// =============================================

interface StatusCardProps {
  label: string
  ok: boolean
  okLabel: string
  missingLabel: string
  href: string
}

function StatusCard({ label, ok, okLabel, missingLabel, href }: StatusCardProps) {
  return (
    <div
      className={`rounded-2xl border p-4 flex items-start gap-3 ${
        ok
          ? 'bg-movement-100 bg-movement-600/10 border-movement-200 border-movement-600/20'
          : 'bg-surface-container border-surface-container-high'
      }`}
    >
      <span
        className={`mt-0.5 flex-none w-5 h-5 rounded-full flex items-center justify-center text-xs ${
          ok ? 'bg-movement-500 text-white' : 'bg-surface-container-high text-white'
        }`}
      >
        {ok ? '✓' : '·'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-on-surface-variant">{label}</p>
        <p className={`text-sm font-semibold mt-0.5 ${ok ? 'text-movement-700 text-movement-400' : 'text-on-surface-variant'}`}>
          {ok ? okLabel : missingLabel}
        </p>
      </div>
      {!ok && (
        <Link
          href={href}
          className="shrink-0 text-xs px-2.5 py-1 bg-surface-container border border-surface-container-high rounded-lg text-on-surface-variant text-on-surface-variant hover:border-outline hover:text-on-surface transition-colors"
        >
          Erfassen
        </Link>
      )}
    </div>
  )
}

// =============================================
// Stat card
// =============================================

interface StatCardProps {
  value: number | string
  label: string
  sub?: string
}

function StatCard({ value, label, sub }: StatCardProps) {
  return (
    <div className="bg-surface-container rounded-2xl border border-surface-container-high p-4 text-center">
      <p className="font-display text-3xl font-bold text-on-surface">{value}</p>
      <p className="text-xs font-medium text-on-surface-variant mt-1">{label}</p>
      {sub && <p className="text-xs text-on-surface-variant mt-0.5">{sub}</p>}
    </div>
  )
}

// =============================================
// Page
// =============================================

export default async function AdminPage() {
  const session = await getAuthSession()
  const today = todayString()

  const startDate = await getProjectStartDate()

  const [todayEntry, todayMetrics, recentEntries, entryStats, latestMetrics] = await Promise.all([
    prisma.journalEntry.findFirst({ where: { date: new Date(today) }, select: { id: true, slug: true, title: true } }),
    prisma.dailyMetrics.findFirst({ where: { date: new Date(today) } }),
    prisma.journalEntry.findMany({
      orderBy: { date: 'desc' },
      take: 5,
      select: { id: true, slug: true, title: true, date: true, published: true },
    }),
    prisma.journalEntry.aggregate({
      _count: { id: true },
      where: { published: true },
    }),
    prisma.dailyMetrics.findFirst({
      orderBy: { date: 'desc' },
      where: { OR: [{ weight: { not: null } }, { steps: { not: null } }] },
    }),
  ])

  const draftCount = await prisma.journalEntry.count({ where: { published: false } })
  const publishedCount = entryStats._count.id

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-on-surface mb-1">
          Hallo, {session?.user?.name?.split(' ')[0]}
        </h1>
        <p className="text-on-surface-variant text-sm">{formatDate(new Date(today))}</p>
      </div>

      <section>
        <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Heute</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StatusCard
            label="Journal-Eintrag"
            ok={!!todayEntry}
            okLabel={todayEntry?.title ?? 'Erfasst'}
            missingLabel="Noch kein Eintrag"
            href="/admin/entries/new"
          />
          <StatusCard
            label="Metriken"
            ok={!!todayMetrics}
            okLabel="Werte vorhanden"
            missingLabel="Noch keine Metriken"
            href={`/admin/metrics?date=${today}`}
          />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Übersicht</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value={publishedCount} label="Einträge" sub="veröffentlicht" />
          <StatCard value={draftCount} label="Entwürfe" />
          <StatCard value={getDayNumber(today, startDate)} label="Projekttag" sub="seit Start" />
          <StatCard
            value={latestMetrics?.weight != null ? `${latestMetrics.weight} kg` : '—'}
            label="Letztes Gewicht"
          />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Aktionen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/admin/entries/new"
            className="group bg-surface-container rounded-2xl border border-surface-container-high p-5 flex items-center gap-4 hover:border-nutrition-300 hover:shadow-sm transition-all"
          >
            <div className="flex-none w-10 h-10 bg-nutrition-100 bg-nutrition-600/10 rounded-xl flex items-center justify-center group-hover:bg-nutrition-200 group-hover:bg-nutrition-600/20 transition-colors">
              <svg className="w-5 h-5 text-nutrition-700 text-nutrition-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-on-surface">Neuer Eintrag</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Journal-Eintrag mit Habits erfassen</p>
            </div>
          </Link>
          <Link
            href={`/admin/metrics?date=${today}`}
            className="group bg-surface-container rounded-2xl border border-surface-container-high p-5 flex items-center gap-4 hover:border-movement-300 hover:shadow-sm transition-all"
          >
            <div className="flex-none w-10 h-10 bg-movement-100 bg-movement-600/10 rounded-xl flex items-center justify-center group-hover:bg-movement-200 group-hover:bg-movement-600/20 transition-colors">
              <svg className="w-5 h-5 text-movement-700 text-movement-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-on-surface">Metriken erfassen</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Gewicht, Schritte und weitere Werte</p>
            </div>
          </Link>
        </div>
      </section>

      {recentEntries.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Letzte Einträge</h2>
            <Link href="/admin/entries" className="text-xs text-on-surface-variant hover:text-on-surface transition-colors">
              Alle anzeigen →
            </Link>
          </div>
          <div className="bg-surface-container rounded-2xl border border-surface-container-high divide-y divide-surface-container divide-surface-container">
            {recentEntries.map((entry) => {
              const dateStr = entry.date.toISOString().slice(0, 10)
              return (
                <div key={entry.id} className="px-5 py-3 flex items-center gap-4">
                  <span className="text-xs font-mono text-on-surface-variant shrink-0 w-8 text-right">
                    {getDayNumber(dateStr, startDate)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{entry.title}</p>
                    <p className="text-xs text-on-surface-variant">{formatDateShort(entry.date)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!entry.published && (
                      <span className="text-xs px-1.5 py-0.5 bg-surface-container text-on-surface-variant rounded">
                        Entwurf
                      </span>
                    )}
                    <Link
                      href={`/admin/entries/${entry.id}/edit`}
                      className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      Bearbeiten
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {latestMetrics && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Letzte Metriken</h2>
            <Link href="/admin/metrics" className="text-xs text-on-surface-variant hover:text-on-surface transition-colors">
              Alle anzeigen →
            </Link>
          </div>
          <div className="bg-surface-container rounded-2xl border border-surface-container-high p-5">
            <p className="text-xs text-on-surface-variant mb-3">{formatDate(latestMetrics.date)}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {latestMetrics.weight != null && (
                <div>
                  <p className="text-xs text-on-surface-variant">Gewicht</p>
                  <p className="text-base font-semibold text-on-surface mt-0.5">{latestMetrics.weight} kg</p>
                </div>
              )}
              {latestMetrics.bodyFat != null && (
                <div>
                  <p className="text-xs text-on-surface-variant">Körperfett</p>
                  <p className="text-base font-semibold text-on-surface mt-0.5">{latestMetrics.bodyFat}%</p>
                </div>
              )}
              {latestMetrics.steps != null && (
                <div>
                  <p className="text-xs text-on-surface-variant">Schritte</p>
                  <p className="text-base font-semibold text-on-surface mt-0.5">
                    {latestMetrics.steps.toLocaleString('de-CH')}
                  </p>
                </div>
              )}
              {latestMetrics.restingHR != null && (
                <div>
                  <p className="text-xs text-on-surface-variant">Ruheherzfrequenz</p>
                  <p className="text-base font-semibold text-on-surface mt-0.5">{latestMetrics.restingHR} bpm</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
