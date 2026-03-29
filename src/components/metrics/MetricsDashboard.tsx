import { getWeightHistory, getStepsHistory, getBodyFatHistory, getLatestMetrics } from '@/lib/metrics'
import { WeightChart } from './WeightChart'
import { StepsChart } from './StepsChart'
import { BodyFatChart } from './BodyFatChart'
import type { WeightDataPoint } from './WeightChart'
import type { StepsDataPoint } from './StepsChart'
import type { BodyFatDataPoint } from './BodyFatChart'

function toDateString(date: Date | string): string {
  if (typeof date === 'string') return date
  return date.toISOString().slice(0, 10)
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-sand-200 dark:border-[#4a4540] bg-sand-50 dark:bg-[#2d2926] px-6 py-10 text-center">
      <p className="font-display text-lg text-sand-400 mb-1">Noch keine Metriken</p>
      <p className="text-sm text-sand-400">
        Daten werden täglich via Fitbit automatisch importiert.
      </p>
    </div>
  )
}

export async function MetricsDashboard() {
  const [weightRaw, stepsRaw, bodyFatRaw, summary] = await Promise.all([
    getWeightHistory(90),
    getStepsHistory(30),
    getBodyFatHistory(90),
    getLatestMetrics(),
  ])

  const weightData: WeightDataPoint[] = weightRaw.map((d) => ({
    date: toDateString(d.date),
    weight: d.weight!,
  }))

  const stepsData: StepsDataPoint[] = stepsRaw.map((d) => ({
    date: toDateString(d.date),
    steps: d.steps!,
  }))

  const bodyFatData: BodyFatDataPoint[] = bodyFatRaw.map((d) => ({
    date: toDateString(d.date),
    bodyFat: d.bodyFat!,
  }))

  const hasWeight = weightData.length > 0
  const hasSteps = stepsData.length > 0
  const hasBodyFat = bodyFatData.length > 0
  const hasAnyData = hasWeight || hasSteps || hasBodyFat

  return (
    <section className="mb-14">
      <h2 className="font-display text-xl font-bold text-[#1a1714] dark:text-[#faf9f7] mb-5">Metriken</h2>

      {!hasAnyData ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {hasWeight && (
              <div className="sm:col-span-2">
                <WeightChart data={weightData} latestWeight={summary.latestWeight} />
              </div>
            )}
            {hasSteps && (
              <div className={!hasWeight ? 'sm:col-span-3' : ''}>
                <StepsChart data={stepsData} avgSteps={summary.avgSteps30d} />
              </div>
            )}
            {!hasWeight && !hasSteps && null}
          </div>

          {hasBodyFat && (
            <BodyFatChart data={bodyFatData} latestBodyFat={summary.latestBodyFat} />
          )}
        </div>
      )}
    </section>
  )
}
