'use client'

import { useLocale, useTranslations } from 'next-intl'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export interface WeightDataPoint {
  date: string
  weight: number
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function formatDateShort(dateStr: string, locale: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  })
}

function formatDateLong(dateStr: string, locale: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
  })
}

function WeightTooltip({ active, payload, label }: TooltipProps) {
  const locale = useLocale()
  if (!active || !payload?.length) return null
  return (
    <div className="bg-ctp-base border border-ctp-surface1 rounded-lg px-3 py-2 text-sm shadow-sm">
      <p className="text-sand-400 text-xs mb-0.5">{formatDateLong(label ?? '', locale)}</p>
      <p className="font-semibold text-ctp-text">{payload[0].value.toFixed(1)} kg</p>
    </div>
  )
}

interface WeightChartProps {
  data: WeightDataPoint[]
  latestWeight?: number
}

export function WeightChart({ data, latestWeight }: WeightChartProps) {
  const locale = useLocale()
  const t = useTranslations('Charts')
  const weights = data.map((d) => d.weight)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const yMin = Math.floor(min - 0.5)
  const yMax = Math.ceil(max + 0.5)

  return (
    <div className="bg-ctp-base rounded-2xl border border-ctp-surface1 p-5 h-full">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-display font-semibold text-sm text-ctp-text">{t('weight')}</h3>
        {latestWeight !== undefined && (
          <span className="text-2xl font-bold font-display text-nutrition-700 dark:text-nutrition-400">
            {latestWeight.toFixed(1)}{' '}
            <span className="text-sm font-normal text-sand-400">kg</span>
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={180}>
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
            tickFormatter={(v: number) => `${v}`}
            tickLine={false}
            axisLine={false}
            domain={[yMin, yMax]}
            unit=" kg"
          />
          <Tooltip content={<WeightTooltip />} />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#d97706"
            strokeWidth={2}
            dot={{ fill: '#d97706', r: 2.5, strokeWidth: 0 }}
            activeDot={{ r: 4, fill: '#d97706' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
