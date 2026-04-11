import { useTranslations } from 'next-intl'
import type { HabitsFrontmatter } from '@/lib/journal'
import { isMovementFulfilled, isNutritionFulfilled, isSmokingFulfilled } from '@/lib/habits'
import { Icon } from '@/components/ui/Icon'

interface HabitBadgesProps {
  habits: HabitsFrontmatter
}

interface BadgeProps {
  label: string
  fulfilled: boolean
  colorClass: string
  dimClass: string
  icon: string
}

function HabitBadge({ label, fulfilled, colorClass, dimClass, icon }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-label font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border ${
        fulfilled ? colorClass : dimClass
      }`}
      title={label}
    >
      <Icon name={icon} size={14} fill={fulfilled} />
      {label}
    </span>
  )
}

export function HabitBadges({ habits }: HabitBadgesProps) {
  const t = useTranslations('HabitBadges')

  return (
    <div className="flex flex-wrap gap-2">
      <HabitBadge
        label={t(`movement.${habits.movement}` as 'movement.minimal')}
        fulfilled={isMovementFulfilled(habits.movement)}
        icon="directions_run"
        colorClass="bg-movement-600/20 text-movement-400 border-movement-600/30"
        dimClass="bg-surface-container border-outline-variant/20 text-on-surface-variant"
      />
      <HabitBadge
        label={t(`nutrition.${habits.nutrition}` as 'nutrition.none')}
        fulfilled={isNutritionFulfilled(habits.nutrition)}
        icon="restaurant"
        colorClass="bg-nutrition-600/20 text-nutrition-400 border-nutrition-600/30"
        dimClass="bg-surface-container border-outline-variant/20 text-on-surface-variant"
      />
      <HabitBadge
        label={t(`smoking.${habits.smoking}` as 'smoking.smoked')}
        fulfilled={isSmokingFulfilled(habits.smoking)}
        icon="air"
        colorClass="bg-smoking-600/20 text-smoking-400 border-smoking-600/30"
        dimClass="bg-surface-container border-outline-variant/20 text-on-surface-variant"
      />
    </div>
  )
}
