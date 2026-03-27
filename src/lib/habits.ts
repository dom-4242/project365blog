import { MovementLevel, NutritionLevel, SmokingStatus } from '@prisma/client'
import { getAllEntries, type MovementValue, type NutritionValue, type SmokingValue } from './journal'

// =============================================
// Streak-Definitionen (Issue #3):
//   Bewegung  ≥ STEPS_ONLY   → steps_only | steps_trained
//   Ernährung ≥ ONE          → one | two | three
//   Rauchstopp = NONE        → none (replacement zählt nicht)
// =============================================

export function isMovementFulfilled(movement: MovementValue): boolean {
  return movement === 'steps_only' || movement === 'steps_trained'
}

export function isNutritionFulfilled(nutrition: NutritionValue): boolean {
  return nutrition === 'one' || nutrition === 'two' || nutrition === 'three'
}

export function isSmokingFulfilled(smoking: SmokingValue): boolean {
  return smoking === 'none'
}

// =============================================
// Frontmatter-String → Prisma-Enum
// =============================================

export const MOVEMENT_ENUM_MAP: Record<MovementValue, MovementLevel> = {
  minimal: MovementLevel.MINIMAL,
  steps_only: MovementLevel.STEPS_ONLY,
  steps_trained: MovementLevel.STEPS_TRAINED,
}

export const NUTRITION_ENUM_MAP: Record<NutritionValue, NutritionLevel> = {
  none: NutritionLevel.NONE,
  one: NutritionLevel.ONE,
  two: NutritionLevel.TWO,
  three: NutritionLevel.THREE,
}

export const SMOKING_ENUM_MAP: Record<SmokingValue, SmokingStatus> = {
  smoked: SmokingStatus.SMOKED,
  replacement: SmokingStatus.REPLACEMENT,
  none: SmokingStatus.NONE,
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
  if (m === 'steps_trained') return 2
  if (m === 'steps_only') return 1
  return 0
}

export function getNutritionLevel(n: NutritionValue): number {
  if (n === 'three') return 3
  if (n === 'two') return 2
  if (n === 'one') return 1
  return 0
}

export function getSmokingLevel(s: SmokingValue): number {
  if (s === 'none') return 2
  if (s === 'replacement') return 1
  return 0
}

export function getMovementStreak(): StreakResult {
  const entries = getAllEntries()
  return calculateStreak(entries.map((e) => isMovementFulfilled(e.habits.movement)))
}

export function getNutritionStreak(): StreakResult {
  const entries = getAllEntries()
  return calculateStreak(entries.map((e) => isNutritionFulfilled(e.habits.nutrition)))
}

export function getSmokingStreak(): StreakResult {
  const entries = getAllEntries()
  return calculateStreak(entries.map((e) => isSmokingFulfilled(e.habits.smoking)))
}
