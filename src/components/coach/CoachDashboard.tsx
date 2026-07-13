'use client'

import { NutritionColumn } from './NutritionColumn'
import { BodyColumn, type BodyColumnData } from './BodyColumn'
import { MovementColumn, type StepsPoint } from './MovementColumn'
import type {
  CoachDietPhase,
  CoachNutritionDay,
  CoachNutritionWeek,
} from '@/lib/coach'

export interface CoachDashboardProps {
  nutrition: {
    phase: CoachDietPhase | null
    days: CoachNutritionDay[]
    week: CoachNutritionWeek
  }
  body: BodyColumnData
  movement: {
    steps: StepsPoint[]
    trainedDates: string[]
    stepsGoal: number
  }
}

/**
 * Desktop-first 3-Spalten-Dashboard (Nutrition | Body | Bewegung).
 * Read-only — enthält keine mutierenden Interaktionen.
 */
export function CoachDashboard({ nutrition, body, movement }: CoachDashboardProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 xl:gap-8 items-start">
      <NutritionColumn phase={nutrition.phase} days={nutrition.days} week={nutrition.week} />
      <BodyColumn data={body} />
      <MovementColumn
        steps={movement.steps}
        trainedDates={movement.trainedDates}
        stepsGoal={movement.stepsGoal}
      />
    </div>
  )
}
