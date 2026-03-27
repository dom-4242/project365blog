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

const MOVEMENT_LABELS: Record<HabitsFrontmatter['movement'], string> = {
  minimal: 'Minimal',
  steps_only: '10k+',
  steps_trained: '10k+ & Training',
}

const NUTRITION_LABELS: Record<HabitsFrontmatter['nutrition'], string> = {
  none: '0 Mahlzeiten',
  one: '1 Mahlzeit',
  two: '2 Mahlzeiten',
  three: '3 Mahlzeiten',
}

const SMOKING_LABELS: Record<HabitsFrontmatter['smoking'], string> = {
  smoked: 'Geraucht',
  replacement: 'Ersatz',
  none: 'Rauchfrei',
}

export function HabitBadges({ habits }: HabitBadgesProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <HabitBadge
        label={MOVEMENT_LABELS[habits.movement]}
        fulfilled={isMovementFulfilled(habits.movement)}
        colorClass="bg-movement-100 text-movement-700"
        dimClass="bg-sand-100 text-sand-500"
      />
      <HabitBadge
        label={NUTRITION_LABELS[habits.nutrition]}
        fulfilled={isNutritionFulfilled(habits.nutrition)}
        colorClass="bg-nutrition-100 text-nutrition-700"
        dimClass="bg-sand-100 text-sand-500"
      />
      <HabitBadge
        label={SMOKING_LABELS[habits.smoking]}
        fulfilled={isSmokingFulfilled(habits.smoking)}
        colorClass="bg-smoking-100 text-smoking-700"
        dimClass="bg-sand-100 text-sand-500"
      />
    </div>
  )
}
