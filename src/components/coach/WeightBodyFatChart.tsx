'use client'

import { useMemo, useState } from 'react'
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
import { SectionCard, RangeToggle, type RangeDays } from './shared'

export interface WeightBodyFatPoint {
  date: string
  weight?: number | null
  bodyFat?: number | null
}

const WEIGHT_COLOR = '#ff8f70'
const FAT_COLOR = '#eaa5ff'

function formatDateShort(dateStr: string, locale: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  })
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>
  label?: string
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  const locale = useLocale()
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-container border border-outline-variant/15 rounded px-3 py-2 text-sm">
      <p className="text-on-surface-variant text-xs mb-1">{formatDateShort(label ?? '', locale)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-semibold" style={{ color: p.color }}>
          {p.value.toFixed(1)} {p.dataKey === 'weight' ? 'kg' : '%'}
        </p>
      ))}
    </div>
  )
}

export function WeightBodyFatChart({ data }: { data: WeightBodyFatPoint[] }) {
  const locale = useLocale()
  const t = useTranslations('Coach')
  const [range, setRange] = useState<RangeDays>(30)

  const sliced = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - range)
    return data.filter((d) => new Date(d.date + 'T00:00:00') >= cutoff)
  }, [data, range])

  return (
    <SectionCard
      title={t('weightBodyFatTrend')}
      action={<RangeToggle value={range} onChange={setRange} />}
    >
      <div className="flex items-center gap-4 mb-2 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded" style={{ backgroundColor: WEIGHT_COLOR }} />
          <span className="text-on-surface-variant">{t('weight')} (kg)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded" style={{ backgroundColor: FAT_COLOR }} />
          <span className="text-on-surface-variant">{t('bodyFat')} (%)</span>
        </span>
      </div>
      {sliced.length === 0 ? (
        <p className="text-sm text-on-surface-variant py-12 text-center">{t('noData')}</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={sliced} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--chart-axis)' }}
              tickFormatter={(v) => formatDateShort(v, locale)}
              tickLine={false}
              axisLine={{ stroke: 'var(--chart-axis-line)' }}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              yAxisId="weight"
              tick={{ fontSize: 10, fill: 'var(--chart-axis)' }}
              tickLine={false}
              axisLine={false}
              domain={['dataMin - 1', 'dataMax + 1']}
              width={36}
            />
            <YAxis
              yAxisId="fat"
              orientation="right"
              tick={{ fontSize: 10, fill: 'var(--chart-axis)' }}
              tickLine={false}
              axisLine={false}
              domain={['dataMin - 1', 'dataMax + 1']}
              width={30}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              yAxisId="weight"
              type="monotone"
              dataKey="weight"
              stroke={WEIGHT_COLOR}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: WEIGHT_COLOR }}
              connectNulls
            />
            <Line
              yAxisId="fat"
              type="monotone"
              dataKey="bodyFat"
              stroke={FAT_COLOR}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: FAT_COLOR }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </SectionCard>
  )
}
