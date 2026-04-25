'use client'

import {
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  XAxis,
} from 'recharts'

interface DataPoint {
  date: string
  ml: number
}

interface DrinkSparklineProps {
  data: DataPoint[]
  targetMl: number
  moreIsBetter: boolean
}

const COLOR_MET    = '#62bc44'  // movement-400 green
const COLOR_WATER  = '#ff8f70'  // primary orange (water not met)
const COLOR_COLA   = '#ff716c'  // error red (cola over limit)

export function DrinkSparkline({ data, targetMl, moreIsBetter }: DrinkSparklineProps) {
  return (
    <ResponsiveContainer width="100%" height={48}>
      <BarChart data={data} margin={{ top: 4, right: 2, bottom: 0, left: 2 }} barCategoryGap="25%">
        <XAxis dataKey="date" hide />
        <ReferenceLine
          y={targetMl}
          stroke="rgba(255,143,112,0.35)"
          strokeDasharray="4 3"
          strokeWidth={1}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          contentStyle={{
            background: '#1a1919',
            border: '1px solid rgba(72,72,71,0.4)',
            borderRadius: 4,
            fontSize: 11,
            padding: '4px 8px',
          }}
          labelStyle={{ color: '#adaaaa', fontSize: 10, marginBottom: 2 }}
          itemStyle={{ color: '#ffffff' }}
          formatter={(v: number) => [`${(v / 1000).toFixed(2)} L`, '']}
          labelFormatter={(label: string) => {
            const [y, m, d] = (label as string).split('-').map(Number)
            return new Date(y, m - 1, d).toLocaleDateString('de-CH', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
            })
          }}
        />
        <Bar dataKey="ml" radius={[2, 2, 0, 0]} maxBarSize={24}>
          {data.map((entry) => {
            const met = moreIsBetter ? entry.ml >= targetMl : entry.ml <= targetMl
            const fill = met
              ? COLOR_MET
              : moreIsBetter
                ? COLOR_WATER
                : COLOR_COLA
            return <Cell key={entry.date} fill={fill} fillOpacity={entry.ml === 0 ? 0.2 : 0.85} />
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
