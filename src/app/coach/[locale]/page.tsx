import { getTranslations } from 'next-intl/server'
import { getProfile } from '@/lib/profile'
import { getLatestMetrics, getStepsHistory } from '@/lib/metrics'
import {
  getCoachDietPhase,
  getCoachNutritionRange,
  getCoachNutritionWeek,
  getWeightBodyFatHistory,
  getBodyMeasurementTrends,
  getBodyComposition,
  getSegmentalComposition,
  getTrainingDays,
  listCoachBodyPhotos,
  computeTrend,
} from '@/lib/coach'
import { CoachDashboard } from '@/components/coach/CoachDashboard'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { locale: string }
}

export default async function CoachPage({ params: { locale } }: PageProps) {
  const t = await getTranslations({ locale, namespace: 'Coach' })
  const profile = await getProfile()

  const [
    phase,
    nutritionDays,
    nutritionWeek,
    metrics,
    history,
    measurements,
    composition,
    segmental,
    stepsRows,
    training,
    photos,
  ] = await Promise.all([
    getCoachDietPhase(),
    getCoachNutritionRange(30),
    getCoachNutritionWeek(),
    getLatestMetrics(profile.projectStartDate ?? undefined),
    getWeightBodyFatHistory(90),
    getBodyMeasurementTrends(),
    getBodyComposition(),
    getSegmentalComposition(),
    getStepsHistory(90),
    getTrainingDays(90),
    listCoachBodyPhotos(),
  ])

  const weightTrend =
    metrics.weightAvg7d != null
      ? computeTrend(
          Math.round(metrics.weightAvg7d * 10) / 10,
          metrics.weightAvg7dPrev != null ? Math.round(metrics.weightAvg7dPrev * 10) / 10 : null,
        )
      : { delta: null, trend: 'flat' as const }
  const bodyFatTrend =
    metrics.bodyFatAvg7d != null
      ? computeTrend(
          Math.round(metrics.bodyFatAvg7d * 10) / 10,
          metrics.bodyFatAvg7dPrev != null ? Math.round(metrics.bodyFatAvg7dPrev * 10) / 10 : null,
        )
      : { delta: null, trend: 'flat' as const }

  const steps = stepsRows.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    steps: r.steps ?? 0,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline font-bold text-2xl text-on-surface tracking-tight">
          {t('title')}
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">{t('subtitle')}</p>
      </div>

      <CoachDashboard
        nutrition={{ phase, days: nutritionDays, week: nutritionWeek }}
        body={{
          latestWeight: metrics.latestWeight ?? null,
          latestBodyFat: metrics.latestBodyFat ?? null,
          weightTrend: { delta: weightTrend.delta, trend: weightTrend.trend },
          bodyFatTrend: { delta: bodyFatTrend.delta, trend: bodyFatTrend.trend },
          history,
          measurements,
          composition,
          segmental,
          photos,
        }}
        movement={{
          steps,
          trainedDates: training.dates,
          stepsGoal: profile.targetSteps ?? 10000,
        }}
      />
    </div>
  )
}
