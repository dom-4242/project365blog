'use client'

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { DrinkDayData, DrinkStats } from '@/lib/drinks'

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDateShort(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'short',
  })
}

function formatDateLong(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function mlToL(ml: number): number {
  return Math.round(ml) / 1000
}

function rollingAvg(values: number[], window = 7): (number | null)[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1)
    return Math.round(slice.reduce((s, v) => s + v, 0) / slice.length)
  })
}

// ─── Tooltip ───────────────────────────────────────────────────────────────

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  unit: string
}

function DrinkTooltip({ active, payload, label, unit }: ChartTooltipProps) {
  if (!active || !payload?.length || !label) return null
  return (
    <div className="bg-surface-container border border-outline-variant/15 rounded px-3 py-2 text-sm">
      <p className="text-on-surface-variant text-xs mb-1">{formatDateLong(label)}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {(p.value / 1000).toFixed(2)} {unit}
        </p>
      ))}
    </div>
  )
}

// ─── Stats panel ───────────────────────────────────────────────────────────

interface StatsPanelProps {
  stats: DrinkStats
  accentClass: string
  goalMl: number
  goalLabel: string
}

function StatsPanel({ stats, accentClass, goalMl, goalLabel }: StatsPanelProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
      <div className="bg-surface-container rounded-lg p-3">
        <p className="text-xs text-on-surface-variant mb-1">Gesamt</p>
        <p className={`font-headline font-bold text-lg ${accentClass}`}>
          {(stats.total / 1000).toFixed(1)} L
        </p>
      </div>
      <div className="bg-surface-container rounded-lg p-3">
        <p className="text-xs text-on-surface-variant mb-1">Ø / Tag</p>
        <p className={`font-headline font-bold text-lg ${accentClass}`}>
          {(stats.avg / 1000).toFixed(2)} L
        </p>
        <p className="text-xs text-on-surface-variant">{goalLabel}: {(goalMl / 1000).toFixed(1)} L</p>
      </div>
      <div className="bg-surface-container rounded-lg p-3">
        <p className="text-xs text-on-surface-variant mb-1">Max-Tag</p>
        {stats.maxDay ? (
          <>
            <p className="font-headline font-bold text-lg text-on-surface">
              {(stats.maxDay.ml / 1000).toFixed(2)} L
            </p>
            <p className="text-xs text-on-surface-variant">{formatDateShort(stats.maxDay.date)}</p>
          </>
        ) : <p className="text-on-surface-variant">—</p>}
      </div>
      <div className="bg-surface-container rounded-lg p-3">
        <p className="text-xs text-on-surface-variant mb-1">Min-Tag</p>
        {stats.minDay ? (
          <>
            <p className="font-headline font-bold text-lg text-on-surface">
              {(stats.minDay.ml / 1000).toFixed(2)} L
            </p>
            <p className="text-xs text-on-surface-variant">{formatDateShort(stats.minDay.date)}</p>
          </>
        ) : <p className="text-on-surface-variant">—</p>}
      </div>
      <div className="bg-surface-container rounded-lg p-3">
        <p className="text-xs text-on-surface-variant mb-1">Längste Serie</p>
        <p className={`font-headline font-bold text-lg ${accentClass}`}>{stats.streak}</p>
        <p className="text-xs text-on-surface-variant">Tage</p>
      </div>
    </div>
  )
}

// ─── Single drink chart section ────────────────────────────────────────────

interface DrinkSectionProps {
  title: string
  days: DrinkDayData[]
  dataKey: 'waterMl' | 'colaZeroMl'
  stats: DrinkStats
  barColor: string
  lineColor: string
  accentClass: string
  goalMl: number
  goalLabel: string
  goalLineLabel: string
  moreIsBetter: boolean
}

export function DrinkChartSection({
  title,
  days,
  dataKey,
  stats,
  barColor,
  lineColor,
  accentClass,
  goalMl,
  goalLabel,
  goalLineLabel,
  moreIsBetter,
}: DrinkSectionProps) {
  const rawValues = days.map((d) => d[dataKey])
  const avgValues = rollingAvg(rawValues, 7)

  const chartData = days.map((d, i) => ({
    date: d.date,
    daily: d[dataKey],
    avg7d: avgValues[i],
  }))

  const goalL = mlToL(goalMl)

  return (
    <div className="space-y-4">
      <h2 className="font-headline font-bold text-lg text-on-surface">{title}</h2>

      <StatsPanel
        stats={stats}
        accentClass={accentClass}
        goalMl={goalMl}
        goalLabel={goalLabel}
      />

      <div className="bg-surface-container border border-outline-variant/10 rounded-xl p-4">
        {days.length === 0 ? (
          <p className="text-on-surface-variant text-sm py-8 text-center">Keine Daten im gewählten Zeitraum</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--chart-axis)' }}
                tickFormatter={(v) => formatDateShort(v)}
                tickLine={false}
                axisLine={{ stroke: 'var(--chart-axis-line)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--chart-axis)' }}
                tickFormatter={(v) => `${(v / 1000).toFixed(1)}`}
                tickLine={false}
                axisLine={false}
                unit="L"
              />
              <ReferenceLine
                y={goalMl}
                stroke={moreIsBetter ? '#22c55e' : '#ef4444'}
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{
                  value: `${goalL.toFixed(1)}L ${goalLineLabel}`,
                  position: 'insideTopRight',
                  fontSize: 10,
                  fill: moreIsBetter ? '#22c55e' : '#ef4444',
                }}
              />
              <Tooltip content={<DrinkTooltip unit="L" />} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={(value) => value === 'daily' ? 'Täglich' : '7T-Ø'}
              />
              <Bar dataKey="daily" fill={barColor} radius={[2, 2, 0, 0]} maxBarSize={32} name="daily" />
              <Line
                dataKey="avg7d"
                type="monotone"
                stroke={lineColor}
                strokeWidth={2}
                dot={false}
                name="avg7d"
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
