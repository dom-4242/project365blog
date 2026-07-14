'use client'

import { clsx } from 'clsx'
import { Icon } from '@/components/ui/Icon'
import type { Trend } from '@/lib/coach'

export interface MeasurementItem {
  id: string
  label: string
  value: number | null
  unit: string
  delta: number | null
  trend: Trend
  /** For circumferences up/down is neutral; for mass, up=good, fat down=good. */
  goodDirection?: 'up' | 'down'
}

/** Compact, colour-coded change indicator shown in the tile header. */
function Delta({
  delta,
  trend,
  goodDirection,
}: Pick<MeasurementItem, 'delta' | 'trend' | 'goodDirection'>) {
  if (delta == null || trend === 'flat') {
    return (
      <span className="inline-flex items-center text-on-surface-variant/60">
        <Icon name="remove" size={20} className="text-[14px] leading-none" />
      </span>
    )
  }
  const isGood = goodDirection ? trend === goodDirection : undefined
  const color =
    isGood === undefined ? 'text-on-surface-variant' : isGood ? 'text-movement-400' : 'text-error'
  const sign = delta > 0 ? '+' : ''
  return (
    <span
      className={clsx('inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums', color)}
    >
      <Icon
        name={trend === 'up' ? 'trending_up' : 'trending_down'}
        size={20}
        className="text-[14px] leading-none"
      />
      {sign}
      {delta}
    </span>
  )
}

/**
 * Clean spec-sheet grid of body measurements. Replaces the earlier silhouette
 * with floating callouts, which overlapped in the narrow coach column. Tiles
 * are ordered anatomically so left/right pairs land side by side.
 */
export function MeasurementGrid({ items }: { items: MeasurementItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {items.map((it) => (
        <div
          key={it.id}
          className="rounded-lg border border-outline-variant/10 bg-surface-container-low px-3.5 py-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant">
              {it.label}
            </span>
            <Delta delta={it.delta} trend={it.trend} goodDirection={it.goodDirection} />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-bold font-headline text-on-surface tabular-nums">
              {it.value != null ? it.value : '—'}
            </span>
            <span className="text-xs text-on-surface-variant">{it.unit}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
