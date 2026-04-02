'use client'

import { useLocale, useTranslations } from 'next-intl'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'

export interface StepsDataPoint {
  date: string
  steps: number
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

function formatSteps(v: number): string {
  return v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
}

function StepsTooltip({ active, payload, label }: TooltipProps) {
  const locale = useLocale()
  const t = useTranslations('Charts')
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-[#2d2926] border border-sand-200 dark:border-[#4a4540] rounded-lg px-3 py-2 text-sm shadow-sm">
      <p className="text-sand-400 text-xs mb-0.5">{formatDateLong(label ?? '', locale)}</p>
      <p className="font-semibold text-[#1a1714] dark:text-[#faf9f7]">{payload[0].value.toLocaleString(locale)} {t('steps')}</p>
    </div>
  )
}

interface StepsChartProps {
  data: StepsDataPoint[]
  avgSteps?: number
  stepsGoal?: number
}

export function StepsChart({ data, avgSteps, stepsGoal = 10000 }: StepsChartProps) {
  const locale = useLocale()
  const t = useTranslations('Charts')

  return (
    <div className="bg-white dark:bg-[#2d2926] rounded-2xl border border-sand-200 dark:border-[#4a4540] p-5 h-full">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-display font-semibold text-sm text-[#1a1714] dark:text-[#faf9f7]">{t('steps')}</h3>
        {avgSteps !== undefined && (
          <span className="text-2xl font-bold font-display text-movement-700 dark:text-movement-400">
            {formatSteps(avgSteps)}{' '}
            <span className="text-sm font-normal text-sand-400">{t('avgPerDay')}</span>
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
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
            tickFormatter={formatSteps}
            tickLine={false}
            axisLine={false}
          />
          <ReferenceLine
            y={stepsGoal}
            stroke="#16a34a"
            strokeDasharray="4 3"
            strokeWidth={1.5}
            label={{ value: `${formatSteps(stepsGoal)} ${t('goalLabel')}`, position: 'insideTopRight', fontSize: 10, fill: '#16a34a' }}
          />
          <Tooltip content={<StepsTooltip />} />
          <Bar
            dataKey="steps"
            fill="#22c55e"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
