'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { SectionCard, StatTile, TrendBadge, formatDate } from './shared'
import { WeightBodyFatChart, type WeightBodyFatPoint } from './WeightBodyFatChart'
import { MeasurementGrid, type MeasurementItem } from './MeasurementGrid'
import { PhotoCompareGallery } from './PhotoCompareGallery'
import { SegmentalBodyDiagram } from './SegmentalBodyDiagram'
import type {
  BodyComposition,
  BodyMeasurementTrends,
  CoachBodyPhoto,
  MeasurementField,
  SegmentalComposition,
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
  segmental: SegmentalComposition
  photos: CoachBodyPhoto[]
}

// Anatomical top-to-bottom order. With the 2-column grid this makes left/right
// pairs (arms, thighs, calves) land side by side.
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

// Presentation for each Withings composition metric (order comes from lib/coach).
// `unit` is language-neutral except metabolicAge, whose unit is localised via i18n.
const COMPOSITION_META: Record<string, { unit: string; goodDirection?: 'up' | 'down' }> = {
  muscleMass: { unit: 'kg', goodDirection: 'up' },
  fatMass: { unit: 'kg', goodDirection: 'down' },
  leanMass: { unit: 'kg', goodDirection: 'up' },
  bodyWater: { unit: 'kg' },
  boneMass: { unit: 'kg' },
  visceralFat: { unit: '', goodDirection: 'down' },
  bmr: { unit: 'kcal' },
  metabolicAge: { unit: '', goodDirection: 'down' },
}

export function BodyColumn({ data }: { data: BodyColumnData }) {
  const t = useTranslations('Coach')
  const locale = useLocale()

  const measurementItems: MeasurementItem[] = MEASUREMENT_ORDER.flatMap((field) => {
    const v = data.measurements.values[field]
    if (!v) return []
    return [
      {
        id: field,
        label: t(`m_${field}`),
        value: v.current,
        unit: v.unit,
        delta: v.delta,
        trend: v.trend,
      },
    ]
  })

  const compositionItems: MeasurementItem[] = data.composition.metrics.map((m) => {
    const meta = COMPOSITION_META[m.key] ?? { unit: '' }
    return {
      id: m.key,
      label: t(m.key),
      value: m.value,
      unit: m.key === 'metabolicAge' ? t('yearsUnit') : meta.unit,
      delta: m.delta,
      trend: m.trend,
      goodDirection: meta.goodDirection,
    }
  })

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
        {measurementItems.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-8 text-center">{t('noData')}</p>
        ) : (
          <MeasurementGrid items={measurementItems} />
        )}
      </SectionCard>

      {/* Body composition (Withings body scan) */}
      <SectionCard
        title={t('compositionDiagram')}
        action={
          data.composition.latestDate ? (
            <span className="text-[10px] text-on-surface-variant tabular-nums">
              {formatDate(data.composition.latestDate, locale)}
            </span>
          ) : undefined
        }
      >
        {compositionItems.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-8 text-center">{t('noData')}</p>
        ) : (
          <MeasurementGrid items={compositionItems} />
        )}
      </SectionCard>

      {/* Segmentale Körperzusammensetzung (Withings-App-Stil) — nur wenn die
          Waage segmentale Werte liefert. */}
      {data.segmental.hasData && <SegmentalBodyDiagram data={data.segmental} />}

      <PhotoCompareGallery photos={data.photos} />
    </section>
  )
}
