'use client'

import { useTranslations, useLocale } from 'next-intl'

type Pillar = 'movement' | 'nutrition' | 'smoking'

// All class names must be static strings for Tailwind to include them
const COLOR_BY_LEVEL: Record<Pillar, readonly string[]> = {
  movement: [
    'bg-surface-container-low',            // -1: no entry
    'bg-surface-container',             //  0: minimal
    'bg-movement-200 bg-movement-800/40',   //  1: steps_only
    'bg-movement-500 bg-movement-400',      //  2: steps_trained
  ],
  nutrition: [
    'bg-surface-container-low',
    'bg-surface-container',
    'bg-nutrition-100 bg-nutrition-800/30',
    'bg-nutrition-400 bg-nutrition-500',
    'bg-nutrition-500 bg-nutrition-400',
  ],
  smoking: [
    'bg-surface-container-low',
    'bg-surface-container',
    'bg-smoking-200 bg-smoking-800/40',
    'bg-smoking-500 bg-smoking-400',
  ],
}

const LEVEL_KEYS: Record<Pillar, readonly string[]> = {
  movement:  ['movement.minimal', 'movement.steps', 'movement.stepsAndTraining'],
  nutrition: ['nutrition.none', 'nutrition.one', 'nutrition.two', 'nutrition.three'],
  smoking:   ['smoking.smoked', 'smoking.replacement', 'smoking.smokeFree'],
}

export interface HabitYearGridProps {
  movementDays: Array<{ date: string; level: number }>
  nutritionDays: Array<{ date: string; level: number }>
  smokingDays: Array<{ date: string; level: number }>
}

// Day-of-week index where Monday = 0
function getMondayDow(d: Date): number {
  return (d.getDay() + 6) % 7
}

// Returns an array of weeks, each week being 7 date strings or null (padding).
// null = outside the [firstDate, lastDate] range.
function buildWeekGrid(days: Array<{ date: string }>): Array<Array<string | null>> {
  if (days.length === 0) return []

  const firstDate = days[0].date
  const lastDate = days[days.length - 1].date

  // Monday of the week containing firstDate
  const firstObj = new Date(firstDate + 'T00:00:00')
  const startOffset = getMondayDow(firstObj)
  const start = new Date(firstObj)
  start.setDate(start.getDate() - startOffset)

  // Sunday of the week containing lastDate
  const lastObj = new Date(lastDate + 'T00:00:00')
  const endOffset = getMondayDow(lastObj)
  const end = new Date(lastObj)
  end.setDate(end.getDate() + (6 - endOffset))

  const all: Array<string | null> = []
  const curr = new Date(start)
  while (curr <= end) {
    const d = curr.toISOString().slice(0, 10)
    all.push(d >= firstDate && d <= lastDate ? d : null)
    curr.setDate(curr.getDate() + 1)
  }

  // Chunk into weeks (groups of 7)
  const weeks: Array<Array<string | null>> = []
  for (let i = 0; i < all.length; i += 7) {
    weeks.push(all.slice(i, i + 7))
  }
  return weeks
}

const PILLARS: Array<{ key: Pillar; emoji: string }> = [
  { key: 'movement',  emoji: '🏃' },
  { key: 'nutrition', emoji: '🥗' },
  { key: 'smoking',   emoji: '🚭' },
]

export function HabitYearGrid({ movementDays, nutritionDays, smokingDays }: HabitYearGridProps) {
  const t = useTranslations('HabitHeatmap')
  const tDash = useTranslations('HabitsDashboard')
  const locale = useLocale()

  if (movementDays.length === 0) return null

  // All pillars share the same date range, so one grid structure suffices
  const weeks = buildWeekGrid(movementDays)

  const levelMaps: Record<Pillar, Map<string, number>> = {
    movement:  new Map(movementDays.map(d  => [d.date, d.level])),
    nutrition: new Map(nutritionDays.map(d => [d.date, d.level])),
    smoking:   new Map(smokingDays.map(d   => [d.date, d.level])),
  }

  // Month labels: one label per first week of each new month
  const monthLabels: Array<string | null> = (() => {
    let prevMonth = -1
    return weeks.map((week) => {
      const firstInRange = week.find((d) => d !== null)
      if (!firstInRange) return null
      const d = new Date(firstInRange + 'T00:00:00')
      if (d.getMonth() !== prevMonth) {
        prevMonth = d.getMonth()
        return d.toLocaleDateString(locale, { month: 'short' })
      }
      return null
    })
  })()

  function formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  function getLabel(pillar: Pillar, level: number): string {
    if (level === -1) return t('noEntry')
    const key = LEVEL_KEYS[pillar][level]
    return key ? t(key as Parameters<typeof t>[0]) : t('noEntry')
  }

  return (
    <div className="mt-3 bg-surface-container rounded-2xl border border-surface-container-high p-5">
      <h3 className="font-display text-sm font-semibold text-on-surface mb-4">
        {tDash('yearOverview')}
      </h3>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col gap-0" style={{ minWidth: 'max-content' }}>

          {/* Month labels row — spacer mirrors emoji column width */}
          <div className="flex items-end gap-1.5 mb-1">
            <div className="w-5 shrink-0" aria-hidden="true" />
            <div className="flex gap-0.5">
              {monthLabels.map((label, i) => (
                <div key={i} className="relative w-[11px] h-3.5">
                  {label && (
                    <span className="absolute left-0 bottom-0 text-[9px] leading-none text-on-surface-variant whitespace-nowrap">
                      {label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* One row-group per pillar */}
          <div className="flex flex-col gap-2.5">
            {PILLARS.map(({ key, emoji }) => {
              const colors = COLOR_BY_LEVEL[key]
              const levelMap = levelMaps[key]

              return (
                <div key={key} className="flex items-center gap-1.5">
                  {/* Pillar emoji */}
                  <span
                    className="text-sm w-5 shrink-0 text-center leading-none"
                    title={key}
                    aria-label={key}
                  >
                    {emoji}
                  </span>

                  {/* 7-row mini-grid (Mon → Sun) */}
                  <div className="flex flex-col gap-0.5">
                    {[0, 1, 2, 3, 4, 5, 6].map((dow) => (
                      <div key={dow} className="flex gap-0.5">
                        {weeks.map((week, wi) => {
                          const dateStr = week[dow]

                          // Padding cell outside project range → invisible spacer
                          if (!dateStr) {
                            return <div key={wi} className="w-[11px] h-[11px] shrink-0" />
                          }

                          const level = levelMap.get(dateStr) ?? -1
                          const colorClass = colors[level + 1] ?? 'bg-surface-container-low'

                          return (
                            <div
                              key={wi}
                              title={`${formatDate(dateStr)} — ${getLabel(key, level)}`}
                              className={`w-[11px] h-[11px] shrink-0 rounded-[2px] ${colorClass} cursor-default`}
                            />
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Day count */}
          <p className="text-xs text-on-surface-variant mt-3 pl-[26px]">
            {t('dayCount', { count: movementDays.length })}
          </p>

        </div>
      </div>
    </div>
  )
}
