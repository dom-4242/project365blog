import { useTranslations } from 'next-intl'
import type { HabitsFrontmatter } from '@/lib/journal'
import { isMovementFulfilled, isNutritionFulfilled, isSmokingFulfilled } from '@/lib/habits'

interface HabitBadgesProps {
  habits: HabitsFrontmatter
}

interface BadgeProps {
  label: string
  fulfilled: boolean
  level?: 'full' | 'partial'
  colorClass: string
  dimClass: string
}

function HabitBadge({ label, fulfilled, level = 'full', colorClass, dimClass }: BadgeProps) {
  const active = fulfilled
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
        active ? colorClass : dimClass
      }`}
      title={label}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          active
            ? level === 'partial'
              ? 'bg-current opacity-50'
              : 'bg-current'
            : 'bg-current opacity-30'
        }`}
      />
      {label}
    </span>
  )
}

export function HabitBadges({ habits }: HabitBadgesProps) {
  const t = useTranslations('HabitBadges')

  return (
    <div className="flex flex-wrap gap-1.5">
      <HabitBadge
        label={t(`movement.${habits.movement}` as 'movement.minimal')}
        fulfilled={isMovementFulfilled(habits.movement)}
        colorClass="bg-movement-600/20 text-movement-400"
        dimClass="bg-surface-container text-on-surface-variant"
      />
      <HabitBadge
        label={t(`nutrition.${habits.nutrition}` as 'nutrition.none')}
        fulfilled={isNutritionFulfilled(habits.nutrition)}
        colorClass="bg-nutrition-600/20 text-nutrition-400"
        dimClass="bg-surface-container text-on-surface-variant"
      />
      <HabitBadge
        label={t(`smoking.${habits.smoking}` as 'smoking.smoked')}
        fulfilled={isSmokingFulfilled(habits.smoking)}
        colorClass="bg-smoking-600/20 text-smoking-400"
        dimClass="bg-surface-container text-on-surface-variant"
      />
    </div>
  )
}
