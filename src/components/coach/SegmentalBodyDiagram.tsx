'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { useLocale, useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'
import { SectionCard, formatDate } from './shared'
import type { BodyZone, SegmentalComposition, SegmentZone, Trend } from '@/lib/coach'

type Metric = 'fat' | 'muscle'

// Farb-Rampen für die Zonen-Einfärbung (niedrig → hoch). Fett: Lavendel/Violett
// wie in der Withings-App; Muskeln: Türkis. Rein visuelle Werteskala — KEINE
// Perzentil-/Populationsbewertung (die App vergleicht mit anderen Nutzern, das
// lässt sich ohne deren Referenzdaten nicht nachbilden).
const RAMP: Record<Metric, { lo: [number, number, number]; hi: [number, number, number] }> = {
  fat: { lo: [43, 39, 64], hi: [234, 165, 255] },
  muscle: { lo: [30, 54, 50], hi: [86, 224, 196] },
}

// Wertebereiche für die Normalisierung der Farbintensität (typische Segmentwerte).
const RANGE: Record<Metric, { min: number; max: number }> = {
  fat: { min: 12, max: 34 },
  muscle: { min: 52, max: 80 },
}

const NEUTRAL_FILL = '#2c2c2c' // surface-bright (Kopf/Hals)

function lerpColor(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): string {
  const c = a.map((av, i) => Math.round(av + (b[i] - av) * t))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}

function pct(zone: SegmentZone | null, metric: Metric): number | null {
  if (!zone) return null
  return metric === 'fat' ? zone.fatPct : zone.musclePct
}

function delta(zone: SegmentZone | null, metric: Metric): number | null {
  if (!zone) return null
  return metric === 'fat' ? zone.fatDelta : zone.muscleDelta
}

function zoneFill(value: number | null, metric: Metric): string {
  if (value == null) return NEUTRAL_FILL
  const { min, max } = RANGE[metric]
  const t = Math.min(Math.max((value - min) / (max - min), 0), 1)
  const { lo, hi } = RAMP[metric]
  return lerpColor(lo, hi, t)
}

/** Trend aus dem Δ ableiten (gleiche Epsilon-Schwelle wie computeTrend). */
function trendOf(d: number | null): Trend {
  if (d == null) return 'flat'
  return d > 0.05 ? 'up' : d < -0.05 ? 'down' : 'flat'
}

function DeltaTag({ d, metric }: { d: number | null; metric: Metric }) {
  const trend = trendOf(d)
  if (d == null || trend === 'flat') {
    return (
      <span className="inline-flex items-center text-on-surface-variant/60">
        <Icon name="remove" size={20} className="text-[13px] leading-none" />
      </span>
    )
  }
  // Fett runter = gut, Muskeln rauf = gut.
  const good = metric === 'fat' ? trend === 'down' : trend === 'up'
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-0.5 text-[10px] font-medium tabular-nums',
        good ? 'text-movement-400' : 'text-error',
      )}
    >
      <Icon
        name={trend === 'up' ? 'trending_up' : 'trending_down'}
        size={20}
        className="text-[12px] leading-none"
      />
      {d > 0 ? '+' : ''}
      {d}
    </span>
  )
}

function Callout({
  label,
  value,
  d,
  metric,
  className,
  unit = '%',
}: {
  label: string
  value: number | null
  d: number | null
  metric: Metric
  className?: string
  unit?: string
}) {
  return (
    <div
      className={clsx(
        'absolute w-[112px] rounded-lg border border-outline-variant/15 bg-surface-container-low/90 px-2.5 py-1.5 backdrop-blur-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="min-w-0 truncate text-[9px] font-label font-bold uppercase tracking-wider text-on-surface-variant">
          {label}
        </span>
        <DeltaTag d={d} metric={metric} />
      </div>
      <div className="mt-0.5 flex items-baseline gap-0.5">
        <span className="font-headline text-lg font-bold tabular-nums text-on-surface">
          {value != null ? value.toFixed(1) : '—'}
        </span>
        <span className="text-[11px] text-on-surface-variant">{unit}</span>
      </div>
    </div>
  )
}

/** Kleiner Markierungspunkt auf der Figur (wie in der Withings-App). */
function Dot({ cx, cy }: { cx: number; cy: number }) {
  return <circle cx={cx} cy={cy} r={5} fill="#0e0e0e" stroke="#767575" strokeWidth={1} />
}

/**
 * Segmentales Körperdiagramm im Withings-App-Stil: Fett-/Muskel-Umschalter, eine
 * eingefärbte Körpersilhouette (Arme, Torso, Beine) und Callouts je Zone. Nur die
 * vier Callouts der App (Arme/Torso/Beine + Viszeralfett) — die frühere 10-Werte-
 * Silhouette überlappte in der schmalen Coach-Spalte, vier Callouts passen.
 */
export function SegmentalBodyDiagram({ data }: { data: SegmentalComposition }) {
  const t = useTranslations('Coach')
  const locale = useLocale()
  const [metric, setMetric] = useState<Metric>('fat')

  const arms = data.zones.arms
  const torso = data.zones.torso
  const legs = data.zones.legs

  const armsVal = pct(arms, metric)
  const torsoVal = pct(torso, metric)
  const legsVal = pct(legs, metric)

  const armsFill = zoneFill(armsVal, metric)
  const torsoFill = zoneFill(torsoVal, metric)
  const legsFill = zoneFill(legsVal, metric)

  return (
    <SectionCard
      title={t('segmentalTitle')}
      action={
        data.latestDate ? (
          <span className="text-[10px] tabular-nums text-on-surface-variant">
            {formatDate(data.latestDate, locale)}
          </span>
        ) : undefined
      }
    >
      {/* Fett / Muskeln Umschalter */}
      <div className="mb-4 flex justify-center">
        <div className="inline-flex rounded-lg border border-outline-variant/20 bg-surface-container-low p-0.5">
          {(['fat', 'muscle'] as Metric[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              className={clsx(
                'rounded-md px-4 py-1 font-label text-xs font-bold uppercase tracking-widest transition-colors',
                metric === m
                  ? 'bg-surface-bright text-on-surface'
                  : 'text-on-surface-variant hover:text-on-surface',
              )}
            >
              {m === 'fat' ? t('fat') : t('segMuscle')}
            </button>
          ))}
        </div>
      </div>

      {/* Figur + Callouts */}
      <div className="relative mx-auto min-h-[300px] max-w-[360px]">
        <svg
          viewBox="0 0 200 380"
          className="mx-auto block w-[132px]"
          role="img"
          aria-label={t('segmentalTitle')}
        >
          {/* Kopf + Hals (neutral) */}
          <circle cx={100} cy={32} r={22} fill={NEUTRAL_FILL} />
          <rect x={90} y={52} width={20} height={14} rx={4} fill={NEUTRAL_FILL} />

          {/* Torso */}
          <path
            d="M64,70 Q64,64 72,64 L128,64 Q136,64 136,70 L132,150 Q130,196 118,200 L82,200 Q70,196 68,150 Z"
            fill={torsoFill}
            stroke="#484847"
            strokeWidth={1}
          />
          {/* Arme */}
          <rect x={40} y={72} width={20} height={112} rx={10} fill={armsFill} stroke="#484847" strokeWidth={1} />
          <rect x={140} y={72} width={20} height={112} rx={10} fill={armsFill} stroke="#484847" strokeWidth={1} />
          {/* Beine */}
          <rect x={72} y={202} width={24} height={152} rx={11} fill={legsFill} stroke="#484847" strokeWidth={1} />
          <rect x={104} y={202} width={24} height={152} rx={11} fill={legsFill} stroke="#484847" strokeWidth={1} />

          {/* Markierungspunkte */}
          <Dot cx={50} cy={128} />
          <Dot cx={100} cy={120} />
          <Dot cx={100} cy={280} />
        </svg>

        <Callout
          label={t('zoneArms')}
          value={armsVal}
          d={delta(arms, metric)}
          metric={metric}
          className="left-0 top-4"
        />
        <Callout
          label={t('zoneTorso')}
          value={torsoVal}
          d={delta(torso, metric)}
          metric={metric}
          className="right-0 top-4"
        />
        <Callout
          label={t('zoneLegs')}
          value={legsVal}
          d={delta(legs, metric)}
          metric={metric}
          className="bottom-6 left-0"
        />
        {/* Viszeralfett nur in der Fett-Ansicht (wie in der Withings-App). */}
        {metric === 'fat' && data.visceralFat && (
          <Callout
            label={t('visceralFat')}
            value={data.visceralFat.value}
            d={data.visceralFat.delta}
            metric="fat"
            unit="/20"
            className="bottom-6 right-0"
          />
        )}
      </div>

      {/* Farblegende (niedrig → hoch) */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">
          {t('segScaleLow')}
        </span>
        <span
          className="h-1.5 w-28 rounded-full"
          style={{
            background: `linear-gradient(to right, ${zoneFill(RANGE[metric].min, metric)}, ${zoneFill(
              RANGE[metric].max,
              metric,
            )})`,
          }}
        />
        <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">
          {t('segScaleHigh')}
        </span>
      </div>
    </SectionCard>
  )
}
