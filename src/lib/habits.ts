import { getAllEntries, type HabitsFrontmatter } from './journal'

export interface StreakResult {
  current: number
  longest: number
}

function isMovementFulfilled(movement: HabitsFrontmatter['movement']): boolean {
  return movement === 'steps_only' || movement === 'steps_trained'
}

function isNutritionFulfilled(nutrition: HabitsFrontmatter['nutrition']): boolean {
  return nutrition === 'two' || nutrition === 'three'
}

function isSmokingFulfilled(smoking: HabitsFrontmatter['smoking']): boolean {
  return smoking === 'none' || smoking === 'replacement'
}

export function calculateStreak(values: boolean[]): StreakResult {
  let current = 0
  let longest = 0
  let streak = 0

  // values are sorted newest first
  for (let i = 0; i < values.length; i++) {
    if (values[i]) {
      if (i === 0 || values[i - 1]) {
        streak++
      } else {
        streak = 1
      }
      if (i === 0) current = streak
      longest = Math.max(longest, streak)
    } else {
      if (i === 0) current = 0
      streak = 0
    }
  }

  return { current, longest }
}

export function getMovementStreak(): StreakResult {
  const entries = getAllEntries()
  const values = entries.map((e) => isMovementFulfilled(e.habits.movement))
  return calculateStreak(values)
}

export function getNutritionStreak(): StreakResult {
  const entries = getAllEntries()
  const values = entries.map((e) => isNutritionFulfilled(e.habits.nutrition))
  return calculateStreak(values)
}

export function getSmokingStreak(): StreakResult {
  const entries = getAllEntries()
  const values = entries.map((e) => isSmokingFulfilled(e.habits.smoking))
  return calculateStreak(values)
}
