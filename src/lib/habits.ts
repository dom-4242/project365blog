import { MovementLevel, NutritionLevel, SmokingStatus } from '@prisma/client'
import { getAllEntries, type MovementValue, type NutritionValue, type SmokingValue } from './journal'

// =============================================
// Streak-Definitionen (Issue #87):
//   Bewegung  ≥ STEPS_ONLY oder TRAINED_ONLY → steps_only | trained_only | steps_trained
//   Ernährung ≥ TWO_MEALS                    → two_meals | three_meals
//   Rauchstopp ≠ SMOKED                      → nicotine_replacement | smoke_free
// =============================================

export function isMovementFulfilled(movement: MovementValue): boolean {
  return movement === 'steps_only' || movement === 'trained_only' || movement === 'steps_trained'
}

export function isNutritionFulfilled(nutrition: NutritionValue): boolean {
  return nutrition === 'two_meals' || nutrition === 'three_meals'
}

export function isSmokingFulfilled(smoking: SmokingValue): boolean {
  return smoking === 'nicotine_replacement' || smoking === 'smoke_free'
}

// =============================================
// Frontmatter-String → Prisma-Enum
// =============================================

export const MOVEMENT_ENUM_MAP: Record<MovementValue, MovementLevel> = {
  minimal: MovementLevel.MINIMAL,
  steps_only: MovementLevel.STEPS_ONLY,
  trained_only: MovementLevel.TRAINED_ONLY,
  steps_trained: MovementLevel.STEPS_TRAINED,
}

export const NUTRITION_ENUM_MAP: Record<NutritionValue, NutritionLevel> = {
  none: NutritionLevel.NONE,
  one_meal: NutritionLevel.ONE_MEAL,
  two_meals: NutritionLevel.TWO_MEALS,
  three_meals: NutritionLevel.THREE_MEALS,
}

export const SMOKING_ENUM_MAP: Record<SmokingValue, SmokingStatus> = {
  smoked: SmokingStatus.SMOKED,
  nicotine_replacement: SmokingStatus.NICOTINE_REPLACEMENT,
  smoke_free: SmokingStatus.SMOKE_FREE,
}

// =============================================
// Streak-Berechnung
// =============================================

export interface StreakResult {
  current: number
  longest: number
}

/**
 * Berechnet den aktuellen und längsten Streak aus einer Boolean-Liste.
 * @param values - sortiert neueste zuerst
 */
export function calculateStreak(values: boolean[]): StreakResult {
  // Aktueller Streak: konsekutive `true`-Werte ab dem neuesten Eintrag
  let current = 0
  for (const v of values) {
    if (v) current++
    else break
  }

  // Längster Streak: längste konsekutive `true`-Sequenz
  let longest = 0
  let run = 0
  for (const v of values) {
    if (v) {
      run++
      if (run > longest) longest = run
    } else {
      run = 0
    }
  }

  return { current, longest }
}

// =============================================
// Erfüllungsgrad-Level (für Heatmap)
//   -1 = kein Eintrag, 0 = niedrigster, max = bester
// =============================================

export function getMovementLevel(m: MovementValue): number {
  if (m === 'steps_trained') return 3
  if (m === 'steps_only') return 2
  if (m === 'trained_only') return 1
  return 0
}

export function getNutritionLevel(n: NutritionValue): number {
  if (n === 'three_meals') return 3
  if (n === 'two_meals') return 2
  if (n === 'one_meal') return 1
  return 0
}

export function getSmokingLevel(s: SmokingValue): number {
  if (s === 'smoke_free') return 2
  if (s === 'nicotine_replacement') return 1
  return 0
}

export async function getMovementStreak(): Promise<StreakResult> {
  const entries = await getAllEntries()
  return calculateStreak(entries.map((e) => isMovementFulfilled(e.habits.movement)))
}

export async function getNutritionStreak(): Promise<StreakResult> {
  const entries = await getAllEntries()
  return calculateStreak(entries.map((e) => isNutritionFulfilled(e.habits.nutrition)))
}

export async function getSmokingStreak(): Promise<StreakResult> {
  const entries = await getAllEntries()
  return calculateStreak(entries.map((e) => isSmokingFulfilled(e.habits.smoking)))
}
