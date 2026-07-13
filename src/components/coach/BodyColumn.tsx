'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { SectionCard, StatTile, TrendBadge, formatDate } from './shared'
import { WeightBodyFatChart, type WeightBodyFatPoint } from './WeightBodyFatChart'
import { BodyDiagram, type DiagramCallout } from './BodyDiagram'
import { PhotoCompareGallery } from './PhotoCompareGallery'
import type {
  BodyComposition,
  BodyMeasurementTrends,
  CoachBodyPhoto,
  MeasurementField,
  Trend,
} from '@/lib/coach'

export interface BodyColumnData {
  latestWeight: number | null
  latestBodyFat: number | null
  weightTrend: { delta: number | null; trend: Trend }
  bodyFatTrend: { delta: number | null; trend: Trend }
  history: WeightBodyFatPoint[]
  measurements: BodyMeasurementTrends
  composition: BodyComposition
  photos: CoachBodyPhoto[]
}

// Anatomical anchor positions (% of the diagram box) for each circumference.
const MEASUREMENT_LAYOUT: Record<
  MeasurementField,
  { x: number; y: number; align: 'left' | 'right' }
> = {
  neck: { x: 54, y: 15, align: 'right' },
  chest: { x: 60, y: 25, align: 'right' },
  upperArmLeft: { x: 33, y: 29, align: 'left' },
  upperArmRight: { x: 67, y: 29, align: 'right' },
  waist: { x: 40, y: 40, align: 'left' },
  hip: { x: 60, y: 47, align: 'right' },
  thighLeft: { x: 40, y: 61, align: 'left' },
  thighRight: { x: 60, y: 61, align: 'right' },
  calfLeft: { x: 42, y: 83, align: 'left' },
  calfRight: { x: 58, y: 83, align: 'right' },
}

const MEASUREMENT_ORDER: MeasurementField[] = [
  'neck',
  'chest',
  'upperArmLeft',
  'upperArmRight',
  'waist',
  'hip',
  'thighLeft',
  'thighRight',
  'calfLeft',
  'calfRight',
]

export function BodyColumn({ data }: { data: BodyColumnData }) {
  const t = useTranslations('Coach')
  const locale = useLocale()

  const measurementCallouts: DiagramCallout[] = MEASUREMENT_ORDER.flatMap((field) => {
    const v = data.measurements.values[field]
    if (!v) return []
    const layout = MEASUREMENT_LAYOUT[field]
    return [
      {
        id: field,
        label: t(`m_${field}`),
        value: v.current,
        unit: v.unit,
        delta: v.delta,
        trend: v.trend,
        x: layout.x,
        y: layout.y,
        align: layout.align,
      },
    ]
  })

  const compositionCallouts: DiagramCallout[] = []
  if (data.composition.muscleMass) {
    const m = data.composition.muscleMass
    compositionCallouts.push({
      id: 'muscle',
      label: t('muscleMass'),
      value: m.current,
      unit: m.unit,
      delta: m.delta,
      trend: m.trend,
      x: 36,
      y: 33,
      align: 'left',
      goodDirection: 'up',
    })
  }
  if (data.composition.fatMass) {
    const f = data.composition.fatMass
    compositionCallouts.push({
      id: 'fat',
      label: t('fatMass'),
      value: f.current,
      unit: f.unit,
      delta: f.delta,
      trend: f.trend,
      x: 64,
      y: 33,
      align: 'right',
      goodDirection: 'down',
    })
  }

  return (
    <section className="space-y-5">
      <h2 className="font-headline font-bold text-lg text-on-surface tracking-tight flex items-center gap-2">
        <Icon name="monitor_weight" size={20} className="text-secondary" />
        {t('bodySection')}
      </h2>

      {/* Current weight & body fat */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label={t('weight')}
          value={data.latestWeight != null ? data.latestWeight.toFixed(1) : '—'}
          unit="kg"
          trend={
            <TrendBadge
              delta={data.weightTrend.delta}
              trend={data.weightTrend.trend}
              unit="kg"
              goodDirection="down"
            />
          }
        />
        <StatTile
          label={t('bodyFat')}
          value={data.latestBodyFat != null ? data.latestBodyFat.toFixed(1) : '—'}
          unit="%"
          trend={
            <TrendBadge
              delta={data.bodyFatTrend.delta}
              trend={data.bodyFatTrend.trend}
              unit="%"
              goodDirection="down"
            />
          }
        />
      </div>

      <WeightBodyFatChart data={data.history} />

      {/* Circumference measurements diagram */}
      <SectionCard
        title={t('measurementsDiagram')}
        action={
          data.measurements.latestDate ? (
            <span className="text-[10px] text-on-surface-variant tabular-nums">
              {formatDate(data.measurements.latestDate, locale)}
            </span>
          ) : undefined
        }
      >
        {measurementCallouts.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-8 text-center">{t('noData')}</p>
        ) : (
          <BodyDiagram callouts={measurementCallouts} />
        )}
      </SectionCard>

      {/* Muscle / fat mass composition diagram */}
      <SectionCard
        title={t('compositionDiagram')}
        action={
          data.composition.muscleMass || data.composition.fatMass ? (
            <span className="text-[10px] text-on-surface-variant tabular-nums">
              {formatDate(
                (data.composition.muscleMass ?? data.composition.fatMass)!.date,
                locale,
              )}
            </span>
          ) : undefined
        }
      >
        {compositionCallouts.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-8 text-center">{t('noData')}</p>
        ) : (
          <BodyDiagram callouts={compositionCallouts} />
        )}
      </SectionCard>

      <PhotoCompareGallery photos={data.photos} />
    </section>
  )
}
