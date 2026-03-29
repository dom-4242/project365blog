import Link from 'next/link'
import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDayNumber } from '@/lib/journal'

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
          ? 'bg-movement-100 dark:bg-movement-600/10 border-movement-200 dark:border-movement-600/20'
          : 'bg-sand-50 dark:bg-[#2d2926] border-sand-200 dark:border-[#4a4540]'
      }`}
    >
      <span
        className={`mt-0.5 flex-none w-5 h-5 rounded-full flex items-center justify-center text-xs ${
          ok ? 'bg-movement-500 text-white' : 'bg-sand-300 dark:bg-[#4a4540] text-white'
        }`}
      >
        {ok ? '✓' : '·'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-sand-500">{label}</p>
        <p className={`text-sm font-semibold mt-0.5 ${ok ? 'text-movement-700 dark:text-movement-400' : 'text-sand-400'}`}>
          {ok ? okLabel : missingLabel}
        </p>
      </div>
      {!ok && (
        <Link
          href={href}
          className="shrink-0 text-xs px-2.5 py-1 bg-white dark:bg-[#3a3531] border border-sand-200 dark:border-[#4a4540] rounded-lg text-sand-600 dark:text-sand-400 hover:border-sand-300 hover:text-[#1a1714] dark:hover:text-[#faf9f7] transition-colors"
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
    <div className="bg-white dark:bg-[#2d2926] rounded-2xl border border-sand-200 dark:border-[#4a4540] p-4 text-center">
      <p className="font-display text-3xl font-bold text-[#1a1714] dark:text-[#faf9f7]">{value}</p>
      <p className="text-xs font-medium text-sand-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-sand-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// =============================================
// Page
// =============================================

export default async function AdminPage() {
  const session = await getAuthSession()
  const today = todayString()

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
        <h1 className="font-display text-2xl font-bold text-[#1a1714] dark:text-[#faf9f7] mb-1">
          Hallo, {session?.user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sand-500 text-sm">{formatDate(new Date(today))}</p>
      </div>

      <section>
        <h2 className="text-xs font-semibold text-sand-400 uppercase tracking-wide mb-3">Heute</h2>
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
        <h2 className="text-xs font-semibold text-sand-400 uppercase tracking-wide mb-3">Übersicht</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value={publishedCount} label="Einträge" sub="veröffentlicht" />
          <StatCard value={draftCount} label="Entwürfe" />
          <StatCard value={getDayNumber(today)} label="Projekttag" sub="seit Start" />
          <StatCard
            value={latestMetrics?.weight != null ? `${latestMetrics.weight} kg` : '—'}
            label="Letztes Gewicht"
          />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-sand-400 uppercase tracking-wide mb-3">Aktionen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/admin/entries/new"
            className="group bg-white dark:bg-[#2d2926] rounded-2xl border border-sand-200 dark:border-[#4a4540] p-5 flex items-center gap-4 hover:border-nutrition-300 hover:shadow-sm transition-all"
          >
            <div className="flex-none w-10 h-10 bg-nutrition-100 dark:bg-nutrition-600/10 rounded-xl flex items-center justify-center group-hover:bg-nutrition-200 dark:group-hover:bg-nutrition-600/20 transition-colors">
              <svg className="w-5 h-5 text-nutrition-700 dark:text-nutrition-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-[#1a1714] dark:text-[#faf9f7]">Neuer Eintrag</p>
              <p className="text-xs text-sand-500 mt-0.5">Journal-Eintrag mit Habits erfassen</p>
            </div>
          </Link>
          <Link
            href={`/admin/metrics?date=${today}`}
            className="group bg-white dark:bg-[#2d2926] rounded-2xl border border-sand-200 dark:border-[#4a4540] p-5 flex items-center gap-4 hover:border-movement-300 hover:shadow-sm transition-all"
          >
            <div className="flex-none w-10 h-10 bg-movement-100 dark:bg-movement-600/10 rounded-xl flex items-center justify-center group-hover:bg-movement-200 dark:group-hover:bg-movement-600/20 transition-colors">
              <svg className="w-5 h-5 text-movement-700 dark:text-movement-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-[#1a1714] dark:text-[#faf9f7]">Metriken erfassen</p>
              <p className="text-xs text-sand-500 mt-0.5">Gewicht, Schritte und weitere Werte</p>
            </div>
          </Link>
        </div>
      </section>

      {recentEntries.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-sand-400 uppercase tracking-wide">Letzte Einträge</h2>
            <Link href="/admin/entries" className="text-xs text-sand-500 hover:text-[#1a1714] dark:hover:text-[#faf9f7] transition-colors">
              Alle anzeigen →
            </Link>
          </div>
          <div className="bg-white dark:bg-[#2d2926] rounded-2xl border border-sand-200 dark:border-[#4a4540] divide-y divide-sand-100 dark:divide-[#3a3531]">
            {recentEntries.map((entry) => {
              const dateStr = entry.date.toISOString().slice(0, 10)
              return (
                <div key={entry.id} className="px-5 py-3 flex items-center gap-4">
                  <span className="text-xs font-mono text-sand-400 shrink-0 w-8 text-right">
                    {getDayNumber(dateStr)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1714] dark:text-[#faf9f7] truncate">{entry.title}</p>
                    <p className="text-xs text-sand-400">{formatDateShort(entry.date)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!entry.published && (
                      <span className="text-xs px-1.5 py-0.5 bg-sand-100 dark:bg-[#3a3531] text-sand-500 rounded">
                        Entwurf
                      </span>
                    )}
                    <Link
                      href={`/admin/entries/${entry.id}/edit`}
                      className="text-xs text-sand-400 hover:text-[#1a1714] dark:hover:text-[#faf9f7] transition-colors"
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
            <h2 className="text-xs font-semibold text-sand-400 uppercase tracking-wide">Letzte Metriken</h2>
            <Link href="/admin/metrics" className="text-xs text-sand-500 hover:text-[#1a1714] dark:hover:text-[#faf9f7] transition-colors">
              Alle anzeigen →
            </Link>
          </div>
          <div className="bg-white dark:bg-[#2d2926] rounded-2xl border border-sand-200 dark:border-[#4a4540] p-5">
            <p className="text-xs text-sand-400 mb-3">{formatDate(latestMetrics.date)}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {latestMetrics.weight != null && (
                <div>
                  <p className="text-xs text-sand-500">Gewicht</p>
                  <p className="text-base font-semibold text-[#1a1714] dark:text-[#faf9f7] mt-0.5">{latestMetrics.weight} kg</p>
                </div>
              )}
              {latestMetrics.bodyFat != null && (
                <div>
                  <p className="text-xs text-sand-500">Körperfett</p>
                  <p className="text-base font-semibold text-[#1a1714] dark:text-[#faf9f7] mt-0.5">{latestMetrics.bodyFat}%</p>
                </div>
              )}
              {latestMetrics.steps != null && (
                <div>
                  <p className="text-xs text-sand-500">Schritte</p>
                  <p className="text-base font-semibold text-[#1a1714] dark:text-[#faf9f7] mt-0.5">
                    {latestMetrics.steps.toLocaleString('de-CH')}
                  </p>
                </div>
              )}
              {latestMetrics.restingHR != null && (
                <div>
                  <p className="text-xs text-sand-500">Ruheherzfrequenz</p>
                  <p className="text-base font-semibold text-[#1a1714] dark:text-[#faf9f7] mt-0.5">{latestMetrics.restingHR} bpm</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
