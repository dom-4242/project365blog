'use client'

import { clsx } from 'clsx'
import { Icon } from '@/components/ui/Icon'
import type { Trend } from '@/lib/coach'

export interface DiagramCallout {
  id: string
  label: string
  value: number | null
  unit: string
  delta: number | null
  trend: Trend
  /** Horizontal anchor in % of width. */
  x: number
  /** Vertical anchor in % of height. */
  y: number
  /** Which side the chip text aligns to. */
  align: 'left' | 'right'
  /** For circumferences smaller is usually "good"; for mass, up=good. */
  goodDirection?: 'up' | 'down'
}

/** A simple front-view human silhouette (stylized, gender-neutral). */
function Silhouette() {
  return (
    <svg
      viewBox="0 0 200 440"
      className="w-full h-full"
      fill="none"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <g
        stroke="var(--chart-axis-line, #767575)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="rgba(255,143,112,0.05)"
      >
        {/* head */}
        <circle cx="100" cy="34" r="24" />
        {/* neck */}
        <path d="M88 56 L88 68 L112 68 L112 56" />
        {/* torso + arms + legs (single closed body) */}
        <path
          d="M70 70
             C 52 74, 44 84, 40 104
             L 30 176 C 28 186, 38 190, 42 180 L 52 116
             C 54 108, 58 104, 66 102
             L 66 210 C 66 220, 74 224, 82 224
             L 84 300 C 84 316, 82 360, 84 404 C 84 416, 96 416, 98 404 L 100 300
             L 102 404 C 104 416, 116 416, 116 404 C 118 360, 116 316, 116 300
             L 118 224 C 126 224, 134 220, 134 210
             L 134 102 C 142 104, 146 108, 148 116 L 158 180
             C 162 190, 172 186, 170 176 L 160 104
             C 156 84, 148 74, 130 70
             C 120 66, 80 66, 70 70 Z"
        />
      </g>
    </svg>
  )
}

function Chip({ callout }: { callout: DiagramCallout }) {
  const { value, unit, delta, trend, align, goodDirection } = callout
  const isGood = goodDirection && trend !== 'flat' ? trend === goodDirection : undefined
  const trendColor =
    isGood === undefined ? 'text-on-surface-variant' : isGood ? 'text-movement-400' : 'text-error'

  return (
    <div
      className={clsx(
        'absolute -translate-y-1/2 flex flex-col',
        align === 'left' ? 'items-end -translate-x-full pr-2' : 'items-start pl-2',
      )}
      style={{ left: `${callout.x}%`, top: `${callout.y}%` }}
    >
      <span className="text-[10px] font-label font-bold tracking-wide uppercase text-on-surface-variant leading-none whitespace-nowrap">
        {callout.label}
      </span>
      <span className="flex items-baseline gap-1 leading-none mt-0.5 whitespace-nowrap">
        <span className="text-sm font-bold font-headline text-on-surface tabular-nums">
          {value != null ? value : '—'}
        </span>
        <span className="text-[10px] text-on-surface-variant">{unit}</span>
        {delta != null && trend !== 'flat' && (
          <span className={clsx('inline-flex items-center', trendColor)}>
            <Icon
              name={trend === 'up' ? 'trending_up' : 'trending_down'}
              size={20}
              className="text-[14px] leading-none"
            />
          </span>
        )}
      </span>
    </div>
  )
}

export function BodyDiagram({ callouts }: { callouts: DiagramCallout[] }) {
  return (
    <div className="relative mx-auto" style={{ width: 260, maxWidth: '100%', aspectRatio: '200 / 440' }}>
      {/* Anchor dots on the silhouette */}
      <div className="absolute inset-0 w-1/2 mx-auto" style={{ width: '46%' }}>
        <Silhouette />
      </div>
      {callouts.map((c) => (
        <span
          key={`dot-${c.id}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-primary -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
          aria-hidden
        />
      ))}
      {callouts.map((c) => (
        <Chip key={c.id} callout={c} />
      ))}
    </div>
  )
}
