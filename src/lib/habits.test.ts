import { describe, it, expect } from 'vitest'
import { MovementLevel, NutritionLevel, SmokingStatus } from '@prisma/client'
import {
  isMovementFulfilled,
  isNutritionFulfilled,
  isSmokingFulfilled,
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
  it('returns true for steps_trained', () => {
    expect(isMovementFulfilled('steps_trained')).toBe(true)
  })
})

describe('isNutritionFulfilled', () => {
  it('returns false for none', () => {
    expect(isNutritionFulfilled('none')).toBe(false)
  })
  it('returns true for one', () => {
    expect(isNutritionFulfilled('one')).toBe(true)
  })
  it('returns true for two', () => {
    expect(isNutritionFulfilled('two')).toBe(true)
  })
  it('returns true for three', () => {
    expect(isNutritionFulfilled('three')).toBe(true)
  })
})

describe('isSmokingFulfilled', () => {
  it('returns false for smoked', () => {
    expect(isSmokingFulfilled('smoked')).toBe(false)
  })
  it('returns false for replacement', () => {
    expect(isSmokingFulfilled('replacement')).toBe(false)
  })
  it('returns true for none', () => {
    expect(isSmokingFulfilled('none')).toBe(true)
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
  it('maps steps_trained → STEPS_TRAINED', () => {
    expect(MOVEMENT_ENUM_MAP.steps_trained).toBe(MovementLevel.STEPS_TRAINED)
  })
  it('covers all MovementValue variants', () => {
    expect(Object.keys(MOVEMENT_ENUM_MAP)).toHaveLength(3)
  })
})

describe('NUTRITION_ENUM_MAP', () => {
  it('maps none → NONE', () => {
    expect(NUTRITION_ENUM_MAP.none).toBe(NutritionLevel.NONE)
  })
  it('maps one → ONE', () => {
    expect(NUTRITION_ENUM_MAP.one).toBe(NutritionLevel.ONE)
  })
  it('maps two → TWO', () => {
    expect(NUTRITION_ENUM_MAP.two).toBe(NutritionLevel.TWO)
  })
  it('maps three → THREE', () => {
    expect(NUTRITION_ENUM_MAP.three).toBe(NutritionLevel.THREE)
  })
  it('covers all NutritionValue variants', () => {
    expect(Object.keys(NUTRITION_ENUM_MAP)).toHaveLength(4)
  })
})

describe('SMOKING_ENUM_MAP', () => {
  it('maps smoked → SMOKED', () => {
    expect(SMOKING_ENUM_MAP.smoked).toBe(SmokingStatus.SMOKED)
  })
  it('maps replacement → REPLACEMENT', () => {
    expect(SMOKING_ENUM_MAP.replacement).toBe(SmokingStatus.REPLACEMENT)
  })
  it('maps none → NONE', () => {
    expect(SMOKING_ENUM_MAP.none).toBe(SmokingStatus.NONE)
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
})
