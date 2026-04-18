'use client'

import {
  LineChart,
  Line,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  XAxis,
} from 'recharts'

interface DataPoint {
  date: string
  steps: number
}

interface StepsSparklineProps {
  data: DataPoint[]
  goal: number
}

export function StepsSparkline({ data, goal }: StepsSparklineProps) {
  return (
    <ResponsiveContainer width="100%" height={64}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
        <XAxis dataKey="date" hide />
        <ReferenceLine
          y={goal}
          stroke="rgba(255,143,112,0.25)"
          strokeDasharray="4 3"
          strokeWidth={1}
        />
        <Tooltip
          contentStyle={{
            background: '#1a1919',
            border: '1px solid rgba(72,72,71,0.4)',
            borderRadius: 4,
            fontSize: 11,
            padding: '4px 8px',
          }}
          labelStyle={{ color: '#adaaaa', fontSize: 10, marginBottom: 2 }}
          itemStyle={{ color: '#62bc44' }}
          formatter={(v: number) => [v.toLocaleString('de-CH'), 'Schritte']}
          labelFormatter={(label: string) =>
            new Date(label).toLocaleDateString('de-CH', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          }
        />
        <Line
          type="monotone"
          dataKey="steps"
          stroke="#62bc44"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3, fill: '#62bc44', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
