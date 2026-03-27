import type { StreakResult } from '@/lib/habits'
import { HabitStreak } from './HabitStreak'
import { HabitHeatmap } from './HabitHeatmap'

type Pillar = 'movement' | 'nutrition' | 'smoking'

interface PillarConfig {
  title: string
  emoji: string
  streakLabel: string
  bgClass: string
  borderClass: string
  textColorClass: string
  barColorClass: string
}

const PILLAR_CONFIG: Record<Pillar, PillarConfig> = {
  movement: {
    title: 'Bewegung',
    emoji: '🏃',
    streakLabel: 'Tage aktiv',
    bgClass: 'bg-movement-100',
    borderClass: 'border-movement-200',
    textColorClass: 'text-movement-700',
    barColorClass: 'bg-movement-500',
  },
  nutrition: {
    title: 'Ernährung',
    emoji: '🥗',
    streakLabel: 'Tage gesund',
    bgClass: 'bg-nutrition-100',
    borderClass: 'border-nutrition-200',
    textColorClass: 'text-nutrition-700',
    barColorClass: 'bg-nutrition-500',
  },
  smoking: {
    title: 'Rauchstopp',
    emoji: '🚭',
    streakLabel: 'Tage rauchfrei',
    bgClass: 'bg-smoking-100',
    borderClass: 'border-smoking-200',
    textColorClass: 'text-smoking-700',
    barColorClass: 'bg-smoking-500',
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
  const cfg = PILLAR_CONFIG[pillar]

  return (
    <div className={`rounded-2xl border ${cfg.bgClass} ${cfg.borderClass} p-5 space-y-5`}>
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden="true">{cfg.emoji}</span>
        <h3 className={`font-display font-semibold text-base ${cfg.textColorClass}`}>
          {cfg.title}
        </h3>
      </div>

      <HabitStreak
        current={streak.current}
        longest={streak.longest}
        totalFulfilled={totalFulfilled}
        totalEntries={totalEntries}
        label={cfg.streakLabel}
        textColorClass={cfg.textColorClass}
        barColorClass={cfg.barColorClass}
      />

      <HabitHeatmap days={days} pillar={pillar} />
    </div>
  )
}
