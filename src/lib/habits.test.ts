import { describe, it, expect } from 'vitest'
import { MovementLevel, NutritionLevel, SmokingStatus } from '@prisma/client'
import {
  isMovementFulfilled,
  isNutritionFulfilled,
  isSmokingFulfilled,
  getNutritionLevel,
  calculateStreak,
  MOVEMENT_ENUM_MAP,
  NUTRITION_ENUM_MAP,
  SMOKING_ENUM_MAP,
} from './habits'

// =============================================
// Fulfillment predicates
// =============================================

describe('isMovementFulfilled', () => {
  it('returns false for minimal', () => {
    expect(isMovementFulfilled('minimal')).toBe(false)
  })
  it('returns true for steps_only', () => {
    expect(isMovementFulfilled('steps_only')).toBe(true)
  })
  it('returns true for trained_only', () => {
    expect(isMovementFulfilled('trained_only')).toBe(true)
  })
  it('returns true for steps_trained', () => {
    expect(isMovementFulfilled('steps_trained')).toBe(true)
  })
})

describe('isNutritionFulfilled', () => {
  // Without meal score → enum fallback (only three_meals counts).
  it('returns false for none (no score)', () => {
    expect(isNutritionFulfilled('none')).toBe(false)
  })
  it('returns false for one_meal (no score)', () => {
    expect(isNutritionFulfilled('one_meal')).toBe(false)
  })
  it('returns false for two_meals (no score)', () => {
    expect(isNutritionFulfilled('two_meals')).toBe(false)
  })
  it('returns true for three_meals (no score)', () => {
    expect(isNutritionFulfilled('three_meals')).toBe(true)
  })
  it('treats null mealScore as "no score" (enum fallback)', () => {
    expect(isNutritionFulfilled('three_meals', null)).toBe(true)
    expect(isNutritionFulfilled('two_meals', null)).toBe(false)
  })

  // With meal score → score takes priority over the enum.
  it('returns true when mealScore ≥ 8.0 (boundary)', () => {
    expect(isNutritionFulfilled('none', 8.0)).toBe(true)
  })
  it('returns true when mealScore is well above threshold', () => {
    expect(isNutritionFulfilled('none', 9.6)).toBe(true)
  })
  it('returns false when mealScore is just below threshold', () => {
    expect(isNutritionFulfilled('three_meals', 7.9)).toBe(false)
  })
  it('returns false when mealScore is 0', () => {
    expect(isNutritionFulfilled('three_meals', 0)).toBe(false)
  })
  it('score overrides enum (high enum, low score)', () => {
    // Stale enum should not save a low-score day.
    expect(isNutritionFulfilled('three_meals', 5.5)).toBe(false)
  })
  it('score overrides enum (low enum, high score)', () => {
    // Stale enum should not block a high-score day.
    expect(isNutritionFulfilled('two_meals', 9.0)).toBe(true)
  })
})

describe('isSmokingFulfilled', () => {
  it('returns false for smoked', () => {
    expect(isSmokingFulfilled('smoked')).toBe(false)
  })
  it('returns true for nicotine_replacement', () => {
    expect(isSmokingFulfilled('nicotine_replacement')).toBe(true)
  })
  it('returns true for smoke_free', () => {
    expect(isSmokingFulfilled('smoke_free')).toBe(true)
  })
})

// =============================================
// Enum mappings
// =============================================

describe('MOVEMENT_ENUM_MAP', () => {
  it('maps minimal → MINIMAL', () => {
    expect(MOVEMENT_ENUM_MAP.minimal).toBe(MovementLevel.MINIMAL)
  })
  it('maps steps_only → STEPS_ONLY', () => {
    expect(MOVEMENT_ENUM_MAP.steps_only).toBe(MovementLevel.STEPS_ONLY)
  })
  it('maps trained_only → TRAINED_ONLY', () => {
    expect(MOVEMENT_ENUM_MAP.trained_only).toBe(MovementLevel.TRAINED_ONLY)
  })
  it('maps steps_trained → STEPS_TRAINED', () => {
    expect(MOVEMENT_ENUM_MAP.steps_trained).toBe(MovementLevel.STEPS_TRAINED)
  })
  it('covers all MovementValue variants', () => {
    expect(Object.keys(MOVEMENT_ENUM_MAP)).toHaveLength(4)
  })
})

describe('NUTRITION_ENUM_MAP', () => {
  it('maps none → NONE', () => {
    expect(NUTRITION_ENUM_MAP.none).toBe(NutritionLevel.NONE)
  })
  it('maps one_meal → ONE_MEAL', () => {
    expect(NUTRITION_ENUM_MAP.one_meal).toBe(NutritionLevel.ONE_MEAL)
  })
  it('maps two_meals → TWO_MEALS', () => {
    expect(NUTRITION_ENUM_MAP.two_meals).toBe(NutritionLevel.TWO_MEALS)
  })
  it('maps three_meals → THREE_MEALS', () => {
    expect(NUTRITION_ENUM_MAP.three_meals).toBe(NutritionLevel.THREE_MEALS)
  })
  it('covers all NutritionValue variants', () => {
    expect(Object.keys(NUTRITION_ENUM_MAP)).toHaveLength(4)
  })
})

describe('SMOKING_ENUM_MAP', () => {
  it('maps smoked → SMOKED', () => {
    expect(SMOKING_ENUM_MAP.smoked).toBe(SmokingStatus.SMOKED)
  })
  it('maps nicotine_replacement → NICOTINE_REPLACEMENT', () => {
    expect(SMOKING_ENUM_MAP.nicotine_replacement).toBe(SmokingStatus.NICOTINE_REPLACEMENT)
  })
  it('maps smoke_free → SMOKE_FREE', () => {
    expect(SMOKING_ENUM_MAP.smoke_free).toBe(SmokingStatus.SMOKE_FREE)
  })
  it('covers all SmokingValue variants', () => {
    expect(Object.keys(SMOKING_ENUM_MAP)).toHaveLength(3)
  })
})

// =============================================
// calculateStreak
// =============================================

describe('calculateStreak', () => {
  it('returns 0/0 for empty list', () => {
    expect(calculateStreak([])).toEqual({ current: 0, longest: 0 })
  })

  it('returns 0/0 when all false', () => {
    expect(calculateStreak([false, false, false])).toEqual({ current: 0, longest: 0 })
  })

  it('returns correct streak when all true', () => {
    expect(calculateStreak([true, true, true])).toEqual({ current: 3, longest: 3 })
  })

  it('current streak breaks at first false', () => {
    // newest first: [true, true, false, true, true, true]
    expect(calculateStreak([true, true, false, true, true, true])).toEqual({
      current: 2,
      longest: 3,
    })
  })

  it('current is 0 when newest entry is false', () => {
    expect(calculateStreak([false, true, true, true])).toEqual({ current: 0, longest: 3 })
  })

  it('current equals full list when no break', () => {
    expect(calculateStreak([true, true, true, true, true])).toEqual({ current: 5, longest: 5 })
  })

  it('longest spans a gap in the middle', () => {
    // [false, true, true, true, false, true, true]
    expect(calculateStreak([false, true, true, true, false, true, true])).toEqual({
      current: 0,
      longest: 3,
    })
  })

  it('single true entry', () => {
    expect(calculateStreak([true])).toEqual({ current: 1, longest: 1 })
  })

  it('single false entry', () => {
    expect(calculateStreak([false])).toEqual({ current: 0, longest: 0 })
  })

  it('alternating true/false', () => {
    // [true, false, true, false, true]
    expect(calculateStreak([true, false, true, false, true])).toEqual({ current: 1, longest: 1 })
  })

  it('longest streak at the end of list (oldest entries)', () => {
    // newest first: [false, false, true, true, true, true]
    expect(calculateStreak([false, false, true, true, true, true])).toEqual({
      current: 0,
      longest: 4,
    })
  })

  // Krankheitstage (null) pausieren den Streak: weder unterbrochen noch gezählt.
  it('null pauses the current streak instead of breaking it', () => {
    // newest first: [true, null, true, true]
    expect(calculateStreak([true, null, true, true])).toEqual({ current: 3, longest: 3 })
  })

  it('current streak continues past leading nulls', () => {
    // newest entries are sick days, streak from before continues
    expect(calculateStreak([null, null, true, true])).toEqual({ current: 2, longest: 2 })
  })

  it('null does not count toward the streak length', () => {
    expect(calculateStreak([true, null, null, true])).toEqual({ current: 2, longest: 2 })
  })

  it('false after null still breaks the current streak', () => {
    // newest first: [true, null, false, true]
    expect(calculateStreak([true, null, false, true])).toEqual({ current: 1, longest: 1 })
  })

  it('longest streak spans a null gap', () => {
    // [false, true, null, true, true, false]
    expect(calculateStreak([false, true, null, true, true, false])).toEqual({
      current: 0,
      longest: 3,
    })
  })

  it('all null returns 0/0', () => {
    expect(calculateStreak([null, null, null])).toEqual({ current: 0, longest: 0 })
  })
})

// =============================================
// N-08: Vorrang von Day.fulfillmentStatus (neues Nutrition-System)
// =============================================
describe('isNutritionFulfilled — nutritionStatus-Vorrang (N-08)', () => {
  it('FULFILLED gewinnt über Enum/Score', () => {
    expect(isNutritionFulfilled('none', 0, 'FULFILLED')).toBe(true)
    expect(isNutritionFulfilled('none', null, 'FULFILLED')).toBe(true)
  })
  it('NOT_FULFILLED gewinnt über Enum/Score', () => {
    expect(isNutritionFulfilled('three_meals', 10, 'NOT_FULFILLED')).toBe(false)
  })
  it('OPEN/null fällt auf Legacy zurück (Score, dann Enum)', () => {
    expect(isNutritionFulfilled('three_meals', null, 'OPEN')).toBe(true)
    expect(isNutritionFulfilled('none', 8.0, 'OPEN')).toBe(true)
    expect(isNutritionFulfilled('none', null, null)).toBe(false)
  })
})

describe('getNutritionLevel — nutritionStatus-Vorrang (N-08)', () => {
  it('FULFILLED → 3, NOT_FULFILLED → 0', () => {
    expect(getNutritionLevel('none', null, 'FULFILLED')).toBe(3)
    expect(getNutritionLevel('three_meals', 9, 'NOT_FULFILLED')).toBe(0)
  })
  it('ohne Status: Legacy-Verhalten (Score/Enum)', () => {
    expect(getNutritionLevel('three_meals')).toBe(3)
    expect(getNutritionLevel('one_meal')).toBe(1)
    expect(getNutritionLevel('none', 5.0)).toBe(2)
  })
})
