import { useTranslations } from 'next-intl'
import type { StreakResult } from '@/lib/habits'
import { HabitStreak } from './HabitStreak'

type Pillar = 'movement' | 'nutrition' | 'smoking'

interface PillarConfig {
  emoji: string
  bgClass: string
  borderClass: string
  textColorClass: string
  barColorClass: string
}

const PILLAR_CONFIG: Record<Pillar, PillarConfig> = {
  movement: {
    emoji: '🏃',
    bgClass: 'bg-movement-600/10',
    borderClass: 'border-movement-600/20',
    textColorClass: 'text-movement-400',
    barColorClass: 'bg-movement-400',
  },
  nutrition: {
    emoji: '🥗',
    bgClass: 'bg-nutrition-600/10',
    borderClass: 'border-nutrition-600/20',
    textColorClass: 'text-nutrition-400',
    barColorClass: 'bg-nutrition-400',
  },
  smoking: {
    emoji: '🚭',
    bgClass: 'bg-smoking-600/10',
    borderClass: 'border-smoking-600/20',
    textColorClass: 'text-smoking-400',
    barColorClass: 'bg-smoking-400',
  },
}

interface HabitPillarProps {
  pillar: Pillar
  streak: StreakResult
  totalFulfilled: number
  totalEntries: number
  days: Array<{ date: string; level: number }>
}

export function HabitPillar({ pillar, streak, totalFulfilled, totalEntries, days }: HabitPillarProps) {
  const t = useTranslations('HabitPillar')
  const cfg = PILLAR_CONFIG[pillar]
  const title = t(`${pillar}.title` as `movement.title`)
  const streakLabel = t(`${pillar}.streakLabel` as `movement.streakLabel`)

  return (
    <div className={`rounded-2xl border ${cfg.borderClass} ${cfg.bgClass} overflow-hidden`}>
      <div className={`h-1 ${cfg.barColorClass}`} />
      <div className="p-5 space-y-5">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">{cfg.emoji}</span>
          <h3 className={`font-headline font-semibold text-base ${cfg.textColorClass}`}>
            {title}
          </h3>
        </div>

        <HabitStreak
          current={streak.current}
          longest={streak.longest}
          totalFulfilled={totalFulfilled}
          totalEntries={totalEntries}
          label={streakLabel}
          textColorClass={cfg.textColorClass}
          barColorClass={cfg.barColorClass}
        />
      </div>
    </div>
  )
}
