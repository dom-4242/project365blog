import { useTranslations } from 'next-intl'
import type { FulfillmentStatus } from '@prisma/client'
import type { HabitsFrontmatter } from '@/lib/journal'
import { isMovementFulfilled, isNutritionFulfilled, isSmokingFulfilled } from '@/lib/habits'
import { Icon } from '@/components/ui/Icon'

interface HabitBadgesProps {
  habits: HabitsFrontmatter
  /** Erfüllungsstatus aus dem neuen Nutrition-System (Day.fulfillmentStatus) —
   * hat Vorrang vor dem gespeicherten `habits.nutrition`. */
  nutritionStatus?: FulfillmentStatus | null
  /** Sick day: replaces the three pillar badges with a single neutral
   * "sick day" badge — habits are recorded but statistically paused. */
  sickDay?: boolean
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

export function HabitBadges({ habits, nutritionStatus, sickDay = false }: HabitBadgesProps) {
  const t = useTranslations('HabitBadges')

  if (sickDay) {
    return (
      <div className="flex flex-wrap gap-2">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-label font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border bg-tertiary/10 text-tertiary border-tertiary/30"
          title={t('sickDayTitle')}
        >
          <Icon name="sick" size={14} fill />
          {t('sickDay')}
        </span>
      </div>
    )
  }

  // Effektiver Ernährungsstatus: Day-Status hat Vorrang vor dem gespeicherten Wert.
  const effectiveNutrition =
    nutritionStatus === 'FULFILLED'
      ? 'fulfilled'
      : nutritionStatus === 'NOT_FULFILLED'
        ? 'not_fulfilled'
        : habits.nutrition
  const nutritionLabel = t(`nutrition.${effectiveNutrition}` as 'nutrition.fulfilled')

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
        fulfilled={isNutritionFulfilled(habits.nutrition, nutritionStatus)}
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
