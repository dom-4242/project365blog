import { prisma } from '@/lib/db'
import { MetricsForm } from '@/components/admin/MetricsForm'

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-CH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatSleep(minutes: number | null): string {
  if (minutes === null) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

interface PageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function MetricsPage({ searchParams }: PageProps) {
  const { date: dateParam } = await searchParams
  const date = dateParam ?? todayString()

  // Load existing metrics for selected date
  const existing = await prisma.dailyMetrics.findUnique({
    where: { date: new Date(date) },
  })

  // Load recent metrics for the table (last 14 days with any data)
  const recent = await prisma.dailyMetrics.findMany({
    orderBy: { date: 'desc' },
    take: 14,
  })

  const initial = existing
    ? {
        weight: existing.weight?.toString() ?? '',
        bodyFat: existing.bodyFat?.toString() ?? '',
        bmi: existing.bmi?.toString() ?? '',
        steps: existing.steps?.toString() ?? '',
        activeMinutes: existing.activeMinutes?.toString() ?? '',
        caloriesBurned: existing.caloriesBurned?.toString() ?? '',
        distance: existing.distance?.toString() ?? '',
        restingHR: existing.restingHR?.toString() ?? '',
        sleepDuration: existing.sleepDuration?.toString() ?? '',
      }
    : undefined

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ctp-text">Metriken erfassen</h1>
        <p className="text-sand-500 text-sm mt-1">Manuell erfasste Werte überschreiben automatische Importe.</p>
      </div>

      <MetricsForm date={date} initial={initial} />

      {/* Recent entries table */}
      {recent.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-base font-semibold text-ctp-text mb-3">Letzte Einträge</h2>
          <div className="bg-ctp-base rounded-2xl border border-ctp-surface1 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-ctp-surface0 text-sand-500 text-left">
                    <th className="px-4 py-3 font-medium">Datum</th>
                    <th className="px-4 py-3 font-medium">Gewicht</th>
                    <th className="px-4 py-3 font-medium">Körperfett</th>
                    <th className="px-4 py-3 font-medium">Schritte</th>
                    <th className="px-4 py-3 font-medium">Schlaf</th>
                    <th className="px-4 py-3 font-medium">HR</th>
                    <th className="px-4 py-3 font-medium">Quelle</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-ctp-surface0 last:border-0 hover:bg-sand-50 dark:hover:bg-ctp-surface0 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-sand-500">
                        {formatDate(row.date)}
                      </td>
                      <td className="px-4 py-3 text-ctp-text">
                        {row.weight != null ? `${row.weight} kg` : '—'}
                      </td>
                      <td className="px-4 py-3 text-ctp-text">
                        {row.bodyFat != null ? `${row.bodyFat}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-ctp-text">
                        {row.steps != null ? row.steps.toLocaleString('de-CH') : '—'}
                      </td>
                      <td className="px-4 py-3 text-ctp-text">
                        {formatSleep(row.sleepDuration)}
                      </td>
                      <td className="px-4 py-3 text-ctp-text">
                        {row.restingHR != null ? `${row.restingHR} bpm` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-1.5 py-0.5 bg-ctp-surface0 text-sand-500 rounded text-xs">
                          {row.source}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
