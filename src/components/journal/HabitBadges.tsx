import { useTranslations } from 'next-intl'
import type { HabitsFrontmatter } from '@/lib/journal'
import { isMovementFulfilled, isNutritionFulfilled, isSmokingFulfilled } from '@/lib/habits'
import { Icon } from '@/components/ui/Icon'

interface HabitBadgesProps {
  habits: HabitsFrontmatter
  /** Nutrition score from the day's MealLog (0–10), if logged. When present,
   * the nutrition badge shows the score (e.g. `9.6 / 10`) instead of the
   * meal-count label, and fulfillment is computed from the score. */
  mealScore?: number | null
}

interface BadgeProps {
  label: string
  fulfilled: boolean
  colorClass: string
  dimClass: string
  icon: string
  /** Optional accessible label override — used when `label` is purely numeric. */
  title?: string
}

function HabitBadge({ label, fulfilled, colorClass, dimClass, icon, title }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-label font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border ${
        fulfilled ? colorClass : dimClass
      }`}
      title={title ?? label}
    >
      <Icon name={icon} size={14} fill={fulfilled} />
      {label}
    </span>
  )
}

export function HabitBadges({ habits, mealScore }: HabitBadgesProps) {
  const t = useTranslations('HabitBadges')
  const hasScore = mealScore !== null && mealScore !== undefined
  const nutritionLabel = hasScore
    ? `${mealScore.toFixed(1)} / 10`
    : t(`nutrition.${habits.nutrition}` as 'nutrition.none')
  const nutritionTitle = hasScore
    ? `${t('nutrition.scoreTitle' as 'nutrition.scoreTitle')}: ${mealScore.toFixed(1)} / 10`
    : nutritionLabel

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
        label={nutritionLabel}
        title={nutritionTitle}
        fulfilled={isNutritionFulfilled(habits.nutrition, mealScore)}
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
