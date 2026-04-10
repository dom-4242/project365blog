'use client'

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

export interface ViewsDataPoint {
  date: string
  views: number
  sessions: number
}

interface ViewsChartProps {
  data: ViewsDataPoint[]
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'short',
  })
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}

function ViewsTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-container border border-surface-container-high rounded-lg px-3 py-2 text-sm shadow-sm">
      <p className="text-on-surface-variant text-xs mb-1">{label ? formatDateShort(label) : ''}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-semibold" style={{ color: p.color }}>
          {p.value} {p.name === 'views' ? 'Aufrufe' : 'Besucher'}
        </p>
      ))}
    </div>
  )
}

function legendFormatter(value: string) {
  return value === 'views' ? 'Aufrufe' : 'Besucher'
}

export function ViewsChart({ data }: ViewsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: 'var(--chart-axis)' }}
          tickFormatter={formatDateShort}
          tickLine={false}
          axisLine={{ stroke: 'var(--chart-axis-line)' }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--chart-axis)' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<ViewsTooltip />} />
        <Legend formatter={legendFormatter} />
        <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="sessions" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
