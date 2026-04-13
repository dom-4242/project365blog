'use client'

import { useLocale } from 'next-intl'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export interface BodyMeasurementDataPoint {
  date: string
  chest?: number | null
  waist?: number | null
  hip?: number | null
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function formatDateShort(dateStr: string, locale: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  })
}

function MeasurementTooltip({ active, payload, label }: TooltipProps) {
  const locale = useLocale()
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-container border border-outline-variant/15 rounded px-3 py-2 text-sm">
      <p className="text-on-surface-variant text-xs mb-1">{formatDateShort(label ?? '', locale)}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value} cm
        </p>
      ))}
    </div>
  )
}

interface DeltaBadgeProps {
  first: number | null | undefined
  last: number | null | undefined
  label: string
}

function DeltaBadge({ first, last, label }: DeltaBadgeProps) {
  if (first == null || last == null) return null
  const delta = last - first
  const sign = delta > 0 ? '+' : ''
  const color = delta < 0 ? 'text-movement-400' : delta > 0 ? 'text-error' : 'text-on-surface-variant'
  return (
    <div className="text-center">
      <p className="text-xs text-on-surface-variant mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-on-surface">{last} cm</p>
      <p className={`text-xs ${color}`}>{sign}{delta.toFixed(1)} cm</p>
    </div>
  )
}

interface BodyMeasurementChartProps {
  data: BodyMeasurementDataPoint[]
}

export function BodyMeasurementChart({ data }: BodyMeasurementChartProps) {
  const locale = useLocale()

  if (data.length === 0) return null

  const first = data[0]
  const last = data[data.length - 1]

  return (
    <div className="bg-surface-container rounded-xl border border-outline-variant/15 p-5 space-y-5">
      <h3 className="font-headline font-semibold text-sm text-on-surface">Körpermasse</h3>

      {/* Delta Übersicht */}
      {data.length >= 2 && (
        <div className="grid grid-cols-3 gap-3 pb-3 border-b border-outline-variant/15">
          <DeltaBadge first={first.chest} last={last.chest} label="Brust" />
          <DeltaBadge first={first.waist} last={last.waist} label="Taille" />
          <DeltaBadge first={first.hip}   last={last.hip}   label="Hüfte" />
        </div>
      )}

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'var(--chart-axis)' }}
            tickFormatter={(v) => formatDateShort(v, locale)}
            tickLine={false}
            axisLine={{ stroke: 'var(--chart-axis-line)' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--chart-axis)' }}
            tickLine={false}
            axisLine={false}
            unit=" cm"
          />
          <Tooltip content={<MeasurementTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="chest" name="Brust" stroke="#ff8f70" strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 4 }} connectNulls />
          <Line type="monotone" dataKey="waist" name="Taille" stroke="#fc7c7c" strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 4 }} connectNulls />
          <Line type="monotone" dataKey="hip"   name="Hüfte"  stroke="#eaa5ff" strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 4 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-on-surface-variant text-center">Brust · Taille · Hüfte — Delta gegenüber erster Messung</p>
    </div>
  )
}
