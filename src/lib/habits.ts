import { MovementLevel, SmokingStatus, type FulfillmentStatus } from '@prisma/client'
import { getAllEntries, type MovementValue, type NutritionValue, type SmokingValue } from './journal'

// =============================================
// Streak-Definitionen:
//   Bewegung   ≥ STEPS_ONLY oder TRAINED_ONLY → steps_only | trained_only | steps_trained
//   Ernährung  erfüllt (Kaloriendefizit erreicht, aus Day.fulfillmentStatus)
//   Rauchstopp ≠ SMOKED                       → nicotine_replacement | smoke_free
// =============================================

export function isMovementFulfilled(movement: MovementValue): boolean {
  return movement === 'steps_only' || movement === 'trained_only' || movement === 'steps_trained'
}

/**
 * Ernährungsziel erfüllt (Nutrition-Umbau, N-09): Kaloriendefizit erreicht.
 * `nutritionStatus` aus dem neuen System (Day.fulfillmentStatus) hat Vorrang;
 * ohne Tages-Log greift der am Eintrag gespeicherte Status (`fulfilled`).
 */
export function isNutritionFulfilled(
  nutrition: NutritionValue,
  nutritionStatus?: FulfillmentStatus | null,
): boolean {
  if (nutritionStatus === 'FULFILLED') return true
  if (nutritionStatus === 'NOT_FULFILLED') return false
  return nutrition === 'fulfilled'
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
 * @param values - sortiert neueste zuerst. `null` = neutraler Tag
 *   (Krankheitstag): pausiert den Streak — weder unterbrochen noch gezählt.
 */
export function calculateStreak(values: (boolean | null)[]): StreakResult {
  // Aktueller Streak: konsekutive `true`-Werte ab dem neuesten Eintrag
  let current = 0
  for (const v of values) {
    if (v === true) current++
    else if (v === false) break
    // null → skip, Streak läuft weiter
  }

  // Längster Streak: längste konsekutive `true`-Sequenz
  let longest = 0
  let run = 0
  for (const v of values) {
    if (v === true) {
      run++
      if (run > longest) longest = run
    } else if (v === false) {
      run = 0
    }
    // null → run bleibt
  }

  return { current, longest }
}

// =============================================
// Erfüllungsgrad-Level (für Heatmap)
//   -2 = Krankheitstag (neutral), -1 = kein Eintrag, 0 = niedrigster, max = bester
// =============================================

/**
 * Heatmap-Level für Krankheitstage — neutraler Sonderzustand, weder Erfolg
 * noch Misserfolg. Muss mit der lokalen Konstante in `HabitYearGrid.tsx`
 * übereinstimmen (dort dupliziert, weil Client-Komponenten dieses Modul
 * nicht importieren dürfen — es zieht Prisma in den Bundle).
 */
export const SICK_LEVEL = -2

export function getMovementLevel(m: MovementValue): number {
  if (m === 'steps_trained') return 3
  if (m === 'steps_only') return 2
  if (m === 'trained_only') return 1
  return 0
}

export function getNutritionLevel(
  n: NutritionValue,
  nutritionStatus?: FulfillmentStatus | null,
): number {
  // Binär seit N-09: erfüllt (Kaloriendefizit erreicht) = 3, sonst 0.
  // Day-Status hat Vorrang vor dem gespeicherten Wert.
  if (nutritionStatus === 'FULFILLED') return 3
  if (nutritionStatus === 'NOT_FULFILLED') return 0
  return n === 'fulfilled' ? 3 : 0
}

export function getSmokingLevel(s: SmokingValue): number {
  if (s === 'smoke_free') return 2
  if (s === 'nicotine_replacement') return 1
  return 0
}

export async function getMovementStreak(): Promise<StreakResult> {
  const entries = await getAllEntries()
  return calculateStreak(
    entries.map((e) => (e.sickDay ? null : isMovementFulfilled(e.habits.movement))),
  )
}

export async function getNutritionStreak(): Promise<StreakResult> {
  const entries = await getAllEntries()
  return calculateStreak(
    entries.map((e) => (e.sickDay ? null : isNutritionFulfilled(e.habits.nutrition, e.nutritionStatus))),
  )
}

export async function getSmokingStreak(): Promise<StreakResult> {
  const entries = await getAllEntries()
  return calculateStreak(
    entries.map((e) => (e.sickDay ? null : isSmokingFulfilled(e.habits.smoking))),
  )
}

/**
 * Streak für Süssigkeiten: zählt aufeinanderfolgende Tage mit sweetsConsumed === false.
 * null-Werte werden übersprungen (Streak weder unterbrochen noch gezählt).
 * true unterbricht den Streak.
 */
export function calculateSweetsStreak(values: (boolean | null)[]): StreakResult {
  let current = 0
  for (const v of values) {
    if (v === false) current++
    else if (v === true) break
    // null → skip, Streak läuft weiter
  }

  let longest = 0
  let run = 0
  for (const v of values) {
    if (v === false) {
      run++
      if (run > longest) longest = run
    } else if (v === true) {
      run = 0
    }
    // null → run bleibt
  }

  return { current, longest }
}

export function computeSweetsRate30d(values: (boolean | null)[]): number {
  const tracked = values.slice(0, 30).filter((v) => v !== null) as boolean[]
  if (tracked.length === 0) return 0
  return Math.round(tracked.filter((v) => v === false).length / tracked.length * 100)
}
