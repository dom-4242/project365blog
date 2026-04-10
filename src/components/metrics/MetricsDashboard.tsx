import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { getWeightHistory, getStepsHistory, getBodyFatHistory, getLatestMetrics } from '@/lib/metrics'
import { getProfile } from '@/lib/profile'
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
  const t = useTranslations('MetricsDashboard')
  return (
    <div className="rounded-2xl border border-surface-container-high bg-surface-container px-6 py-10 text-center">
      <p className="font-display text-lg text-on-surface-variant mb-1">{t('noData')}</p>
      <p className="text-sm text-on-surface-variant">{t('noDataHint')}</p>
    </div>
  )
}

export async function MetricsDashboard() {
  const t = await getTranslations('MetricsDashboard')

  const [weightRaw, stepsRaw, bodyFatRaw, summary, profile] = await Promise.all([
    getWeightHistory(90),
    getStepsHistory(30),
    getBodyFatHistory(90),
    getLatestMetrics(),
    getProfile(),
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
      <h2 className="font-display text-xl font-bold text-on-surface mb-5">{t('heading')}</h2>

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
                <StepsChart data={stepsData} avgSteps={summary.avgSteps30d} stepsGoal={profile.targetSteps ?? 10000} />
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
