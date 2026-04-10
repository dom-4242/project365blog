import { useTranslations } from 'next-intl'
import type { StreakResult } from '@/lib/habits'

type Pillar = 'movement' | 'nutrition' | 'smoking'

interface PillarConfig {
  emoji: string
  textColorClass: string
  barColorClass: string
  bgBarClass: string
}

const PILLAR_CONFIG: Record<Pillar, PillarConfig> = {
  movement: {
    emoji: '🏃',
    textColorClass: 'text-movement-400',
    barColorClass:  'bg-movement-400',
    bgBarClass:     'bg-movement-400',
  },
  nutrition: {
    emoji: '🥗',
    textColorClass: 'text-nutrition-400',
    barColorClass:  'bg-nutrition-400',
    bgBarClass:     'bg-nutrition-400',
  },
  smoking: {
    emoji: '🚭',
    textColorClass: 'text-smoking-400',
    barColorClass:  'bg-smoking-400',
    bgBarClass:     'bg-smoking-400',
  },
}

interface HabitPillarProps {
  pillar: Pillar
  streak: StreakResult
  totalFulfilled: number
  totalEntries: number
  days: Array<{ date: string; level: number }>
}

export function HabitPillar({ pillar, streak, totalFulfilled, totalEntries }: HabitPillarProps) {
  const t = useTranslations('HabitPillar')
  const tStreak = useTranslations('HabitStreak')
  const cfg = PILLAR_CONFIG[pillar]

  const title = t(`${pillar}.title` as `movement.title`)
  const streakLabel = t(`${pillar}.streakLabel` as `movement.streakLabel`)

  const pct = totalEntries > 0 ? Math.round((totalFulfilled / totalEntries) * 100) : 0
  const isRecord = streak.current > 0 && streak.current === streak.longest && streak.longest > 1

  return (
    <div className="bg-surface-container border border-outline-variant/15 rounded-xl overflow-hidden flex flex-col">
      {/* Colour accent — thin top bar */}
      <div className={`h-0.5 shrink-0 ${cfg.bgBarClass}`} />

      <div className="p-5 flex flex-col gap-4 flex-1">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <span className={`text-xs font-label font-bold tracking-widest uppercase ${cfg.textColorClass}`}>
            {title}
          </span>
          <span className="text-base leading-none" aria-hidden="true">{cfg.emoji}</span>
        </div>

        {/* Big streak number */}
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className={`text-6xl font-headline font-bold tracking-tighter leading-none ${cfg.textColorClass}`}>
              {streak.current}
            </span>
            <span className="text-xs text-on-surface-variant leading-tight">{streakLabel}</span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1 h-4">
            {isRecord
              ? tStreak('record')
              : streak.longest > streak.current && streak.longest > 0
                ? tStreak('longestRecord', { days: streak.longest })
                : ''}
          </p>
        </div>

        {/* Progress bar */}
        {totalEntries > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-on-surface-variant">
              <span>
                {tStreak('outOf', {
                  fulfilled: totalFulfilled,
                  total: totalEntries,
                  unit: totalEntries === 1 ? tStreak('day') : tStreak('days'),
                })}
              </span>
              <span className={`font-bold ${cfg.textColorClass}`}>{pct}%</span>
            </div>
            <div className="h-1 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${cfg.barColorClass} transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
