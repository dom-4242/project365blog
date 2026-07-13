'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { Icon } from '@/components/ui/Icon'
import { SectionCard, RangeToggle, StatTile, type RangeDays } from './shared'

export interface StepsPoint {
  date: string
  steps: number
}

const STEPS_COLOR = '#22c55e'
const STEPS_MUTED = '#3f6f4a'
const TRAIN_COLOR = '#ff8f70'

function formatDateShort(dateStr: string, locale: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  })
}

function formatSteps(v: number): string {
  return v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: { date: string; trained: boolean } }>
  label?: string
}

export function MovementColumn({
  steps,
  trainedDates,
  stepsGoal = 10000,
}: {
  steps: StepsPoint[]
  trainedDates: string[]
  stepsGoal?: number
}) {
  const locale = useLocale()
  const t = useTranslations('Coach')
  const [range, setRange] = useState<RangeDays>(30)

  const trainedSet = useMemo(() => new Set(trainedDates), [trainedDates])

  const sliced = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - range)
    return steps
      .filter((d) => new Date(d.date + 'T00:00:00') >= cutoff)
      .map((d) => ({ ...d, trained: trainedSet.has(d.date) }))
  }, [steps, trainedSet, range])

  const trainedInRange = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - range)
    return trainedDates.filter((d) => new Date(d + 'T00:00:00') >= cutoff).length
  }, [trainedDates, range])

  const avgSteps =
    sliced.length > 0
      ? Math.round(sliced.reduce((s, d) => s + d.steps, 0) / sliced.length)
      : 0

  function ChartTooltip({ active, payload, label }: TooltipProps) {
    if (!active || !payload?.length) return null
    const p = payload[0]
    return (
      <div className="bg-surface-container border border-outline-variant/15 rounded px-3 py-2 text-sm">
        <p className="text-on-surface-variant text-xs mb-0.5">
          {formatDateShort(label ?? '', locale)}
        </p>
        <p className="font-semibold text-on-surface">
          {p.value.toLocaleString(locale)} {t('steps')}
        </p>
        {p.payload.trained && (
          <p className="text-xs text-primary flex items-center gap-1 mt-0.5">
            <Icon name="fitness_center" size={20} className="text-[14px]" />
            {t('trained')}
          </p>
        )}
      </div>
    )
  }

  return (
    <section className="space-y-5">
      <h2 className="font-headline font-bold text-lg text-on-surface tracking-tight flex items-center gap-2">
        <Icon name="directions_run" size={20} className="text-movement-400" />
        {t('movementSection')}
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label={t('avgSteps')} value={formatSteps(avgSteps)} unit={t('perDay')} />
        <StatTile
          label={t('trainingDays')}
          value={String(trainedInRange)}
          unit={t('daysInRange', { days: range })}
        />
      </div>

      <SectionCard
        title={t('stepsAndTraining')}
        action={<RangeToggle value={range} onChange={setRange} />}
      >
        <div className="flex items-center gap-4 mb-2 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STEPS_COLOR }} />
            <span className="text-on-surface-variant">{t('trainingDay')}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STEPS_MUTED }} />
            <span className="text-on-surface-variant">{t('noTraining')}</span>
          </span>
        </div>
        {sliced.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-12 text-center">{t('noData')}</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sliced} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
                tick={{ fontSize: 10, fill: 'var(--chart-axis)' }}
                tickFormatter={formatSteps}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <ReferenceLine
                y={stepsGoal}
                stroke={TRAIN_COLOR}
                strokeDasharray="4 3"
                strokeWidth={1.5}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="steps" radius={[3, 3, 0, 0]}>
                {sliced.map((d) => (
                  <Cell key={d.date} fill={d.trained ? STEPS_COLOR : STEPS_MUTED} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </SectionCard>
    </section>
  )
}
