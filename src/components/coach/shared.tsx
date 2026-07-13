'use client'

import { clsx } from 'clsx'
import { Icon } from '@/components/ui/Icon'
import type { Trend } from '@/lib/coach'

/** Kinetic-Lab macro palette (distinct, dark-mode legible). */
export const MACRO_COLORS = {
  protein: '#ff8f70', // primary orange
  carbs: '#eaa5ff', // tertiary
  fat: '#fc7c7c', // secondary
} as const

export type RangeDays = 14 | 30 | 90

export function RangeToggle({
  value,
  onChange,
  options = [14, 30, 90],
}: {
  value: RangeDays
  onChange: (v: RangeDays) => void
  options?: RangeDays[]
}) {
  return (
    <div className="inline-flex rounded-lg border border-outline-variant/20 bg-surface-container-low p-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={clsx(
            'px-2.5 py-1 text-xs font-label font-bold tracking-wide rounded-md transition-colors',
            value === opt
              ? 'bg-surface-bright text-on-surface'
              : 'text-on-surface-variant hover:text-on-surface',
          )}
        >
          {opt}
          <span className="ml-0.5 font-normal lowercase">d</span>
        </button>
      ))}
    </div>
  )
}

/**
 * Tendency badge. `goodDirection` marks which direction should read as positive
 * (green). When unset the badge is colour-neutral.
 */
export function TrendBadge({
  delta,
  trend,
  unit,
  goodDirection,
}: {
  delta: number | null
  trend: Trend
  unit?: string
  goodDirection?: 'up' | 'down'
}) {
  if (delta == null || trend === 'flat') {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-on-surface-variant">
        <Icon name="remove" size={20} className="text-[16px] leading-none" />
        {delta != null && <span>0{unit ? ` ${unit}` : ''}</span>}
      </span>
    )
  }
  const isGood = goodDirection ? trend === goodDirection : undefined
  const color =
    isGood === undefined
      ? 'text-on-surface-variant'
      : isGood
        ? 'text-movement-400'
        : 'text-error'
  const sign = delta > 0 ? '+' : ''
  return (
    <span className={clsx('inline-flex items-center gap-0.5 text-xs font-medium', color)}>
      <Icon
        name={trend === 'up' ? 'trending_up' : 'trending_down'}
        size={20}
        className="text-[16px] leading-none"
      />
      <span>
        {sign}
        {delta}
        {unit ? ` ${unit}` : ''}
      </span>
    </span>
  )
}

export function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={clsx(
        'bg-surface-container rounded-xl border border-outline-variant/15 p-5',
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4 gap-3">
          {title && (
            <h3 className="font-headline font-semibold text-sm text-on-surface">{title}</h3>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function StatTile({
  label,
  value,
  unit,
  trend,
}: {
  label: string
  value: string
  unit?: string
  trend?: React.ReactNode
}) {
  return (
    <div className="bg-surface-container-low rounded-lg border border-outline-variant/10 px-4 py-3">
      <p className="text-[10px] font-label font-bold tracking-widest uppercase text-on-surface-variant mb-1">
        {label}
      </p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold font-headline text-on-surface">{value}</span>
        {unit && <span className="text-sm text-on-surface-variant">{unit}</span>}
      </div>
      {trend && <div className="mt-1">{trend}</div>}
    </div>
  )
}

export function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
