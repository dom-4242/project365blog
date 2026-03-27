'use client'

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
  })
}

function WeightTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-sand-200 rounded-lg px-3 py-2 text-sm shadow-sm">
      <p className="text-sand-400 text-xs mb-0.5">{formatDateLong(label ?? '')}</p>
      <p className="font-semibold text-[#1a1714]">{payload[0].value.toFixed(1)} kg</p>
    </div>
  )
}

interface WeightChartProps {
  data: WeightDataPoint[]
  latestWeight?: number
}

export function WeightChart({ data, latestWeight }: WeightChartProps) {
  const weights = data.map((d) => d.weight)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const yMin = Math.floor(min - 0.5)
  const yMax = Math.ceil(max + 0.5)

  return (
    <div className="bg-white rounded-2xl border border-sand-200 p-5 h-full">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-display font-semibold text-sm text-[#1a1714]">Gewicht</h3>
        {latestWeight !== undefined && (
          <span className="text-2xl font-bold font-display text-nutrition-700">
            {latestWeight.toFixed(1)}{' '}
            <span className="text-sm font-normal text-sand-400">kg</span>
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e4dc" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#b5aca0' }}
            tickFormatter={formatDateShort}
            tickLine={false}
            axisLine={{ stroke: '#e8e4dc' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#b5aca0' }}
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
