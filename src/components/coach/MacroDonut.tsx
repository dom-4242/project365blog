'use client'

import { useTranslations } from 'next-intl'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { MACRO_COLORS } from './shared'
import type { MacroSet } from '@/lib/coach'

interface MacroDonutProps {
  /** IST-Makros (g). */
  actual: MacroSet | null
  /** SOLL-Makros (g) — optional, als Referenz in der Legende. */
  target?: MacroSet | null
  /** Optionaler Text in der Ringmitte (z.B. kcal). */
  centerValue?: string
  centerLabel?: string
}

/**
 * Makro-Verteilungsring (Protein/Carbs/Fat) auf Basis der IST-Gramm.
 * Der Ring zeigt die prozentuale Verteilung; die Legende nennt IST (und SOLL).
 */
export function MacroDonut({ actual, target, centerValue, centerLabel }: MacroDonutProps) {
  const t = useTranslations('Coach')

  const rows = [
    { key: 'protein', label: t('protein'), color: MACRO_COLORS.protein, ist: actual?.proteinG ?? 0, soll: target?.proteinG ?? null },
    { key: 'carbs', label: t('carbs'), color: MACRO_COLORS.carbs, ist: actual?.carbsG ?? 0, soll: target?.carbsG ?? null },
    { key: 'fat', label: t('fat'), color: MACRO_COLORS.fat, ist: actual?.fatG ?? 0, soll: target?.fatG ?? null },
  ]

  const total = rows.reduce((s, r) => s + r.ist, 0)
  const hasData = total > 0
  const pieData = hasData
    ? rows.map((r) => ({ name: r.label, value: r.ist, color: r.color }))
    : [{ name: 'empty', value: 1, color: 'var(--chart-grid, #333)' }]

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: 128, height: 128 }}>
        <ResponsiveContainer width={128} height={128}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              innerRadius={44}
              outerRadius={62}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              {pieData.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerValue ? (
            <>
              <span className="text-lg font-bold font-headline text-on-surface leading-none">
                {centerValue}
              </span>
              {centerLabel && (
                <span className="text-[10px] text-on-surface-variant mt-0.5">{centerLabel}</span>
              )}
            </>
          ) : (
            <span className="text-[10px] text-on-surface-variant">{hasData ? '' : t('noData')}</span>
          )}
        </div>
      </div>

      <ul className="flex-1 min-w-0 space-y-2">
        {rows.map((r) => {
          const pct = hasData ? Math.round((r.ist / total) * 100) : 0
          return (
            <li key={r.key} className="flex items-center gap-2 text-sm">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: r.color }}
                aria-hidden
              />
              <span className="text-on-surface-variant w-16 shrink-0">{r.label}</span>
              <span className="font-semibold text-on-surface tabular-nums">{r.ist} g</span>
              {r.soll != null && (
                <span className="text-on-surface-variant text-xs tabular-nums">
                  / {r.soll} g
                </span>
              )}
              <span className="ml-auto text-xs text-on-surface-variant tabular-nums">{pct}%</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
