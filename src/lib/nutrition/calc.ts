// =============================================================================
// Eckdaten-Rechenlogik (Nutrition-Umbau, N-02)
//
// Bildet die Fibel-Methodik (Sjard Roscher, „Die Fettverlust Fibel") ab:
//   BMR (HB #1 + #2, gemittelt) → TDEE (× Aktivitätsfaktor) → Ziel-kcal
//   (Defizit × 0,8 / 0,7 / −500, Erhalt = TDEE, leichter Überschuss × 1,1)
//   → Makros (Protein g/kg mit Zielgewicht-/FFM-Korrektur bei hohem KF,
//   Fett 15–25 % der kcal bzw. min. 0,5 g/kg, Kohlenhydrate = Rest).
//
// Reine, DB-freie Funktionen — auch clientseitig für die Live-Vorschau nutzbar.
// Referenz-Beispiel (Dom, Stand 2026-07-08): 94 kg / 170 cm / 43 J. / ♂ /
// ~27 % KF / AF 1,55 / moderat  →  2'301 kcal / 185 g P / 51 g F / 275 g KH.
// =============================================================================

export type Sex = 'MALE' | 'FEMALE'
export type PhaseMode = 'DEFICIT' | 'MAINTENANCE' | 'SURPLUS'
export type DeficitMethod = 'MODERATE' | 'AGGRESSIVE' | 'SIMPLE'

export interface EckdatenInput {
  weightKg: number
  heightCm: number
  age: number
  sex: Sex
  bodyFatPct?: number | null
  activityFactor: number
  phaseMode: PhaseMode
  /** Nur relevant bei phaseMode === 'DEFICIT'. */
  deficitMethod: DeficitMethod
  // --- Makro-Parameter (Defaults bilden das Fibel-Beispiel ab) --------------
  /** Protein g pro kg (Normalfall, auf Körpergewicht). Default 2,2. */
  proteinPerKg?: number
  /** Protein g pro kg fettfreier Masse bei hohem KF. Default 2,7. */
  proteinPerKgLean?: number
  /** Fett-Anteil an den Ziel-kcal (♂ 15–25 %, ♀ 25–35 %). Default 0,20. */
  fatPctOfKcal?: number
  /** Mahlzeiten pro Tag. Default 4. */
  mealsPerDay?: number
}

export interface EckdatenResult {
  bmr1: number // Mifflin-St-Jeor
  bmr2: number // Harris-Benedict (überarbeitet)
  bmrAvg: number
  tdee: number // Erhaltungskalorien
  maintenanceKcal: number // == tdee (explizit für Refeed/Erhalt)
  targetKcal: number
  proteinG: number
  fatG: number
  carbsG: number
  mealsPerDay: number
  /** Gewicht (kg), auf das die Protein-Menge bezogen wurde. */
  proteinReferenceKg: number
  /** true, wenn wegen hohem KF auf die fettfreie Masse korrigiert wurde. */
  highBodyFatCorrection: boolean
  /** Menschenlesbare Herleitung — landet in NutritionTargets.calcNote. */
  calcNote: string
}

const round = (n: number) => Math.round(n)

/** KF-Schwelle, ab der die Protein-Korrektur auf fettfreie Masse greift. */
export function isHighBodyFat(sex: Sex, bodyFatPct?: number | null): boolean {
  if (bodyFatPct == null) return false
  return sex === 'MALE' ? bodyFatPct > 25 : bodyFatPct > 32
}

/** BMR #1 — Mifflin-St-Jeor. */
export function bmrMifflin(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return sex === 'MALE' ? base + 5 : base - 161
}

/** BMR #2 — überarbeitete Harris-Benedict-Formel. */
export function bmrHarrisBenedict(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex,
): number {
  return sex === 'MALE'
    ? 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age
    : 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age
}

/** Ziel-kcal aus Erhaltungskalorien je nach Phasen-Modus/Defizit-Methode. */
export function targetKcalFromTdee(
  tdee: number,
  phaseMode: PhaseMode,
  deficitMethod: DeficitMethod,
): number {
  switch (phaseMode) {
    case 'MAINTENANCE':
      return tdee
    case 'SURPLUS':
      return tdee * 1.1 // leichter Überschuss (~+10 %)
    case 'DEFICIT':
    default:
      switch (deficitMethod) {
        case 'AGGRESSIVE':
          return tdee * 0.7
        case 'SIMPLE':
          return tdee - 500
        case 'MODERATE':
        default:
          return tdee * 0.8
      }
  }
}

/**
 * Vollständige Eckdaten-Berechnung nach Fibel-Methodik.
 * Zwischenwerte werden präzise gerechnet und erst am Ende gerundet; die Makros
 * beziehen sich auf die gerundeten Ziel-kcal (wie im Fibel-Eckdaten-Rechner).
 */
export function computeEckdaten(input: EckdatenInput): EckdatenResult {
  const {
    weightKg,
    heightCm,
    age,
    sex,
    bodyFatPct = null,
    activityFactor,
    phaseMode,
    deficitMethod,
    proteinPerKg = 2.2,
    proteinPerKgLean = 2.7,
    fatPctOfKcal = 0.2,
    mealsPerDay = 4,
  } = input

  const bmr1 = bmrMifflin(weightKg, heightCm, age, sex)
  const bmr2 = bmrHarrisBenedict(weightKg, heightCm, age, sex)
  const bmrAvg = (bmr1 + bmr2) / 2
  const tdee = bmrAvg * activityFactor
  const targetKcalRounded = round(targetKcalFromTdee(tdee, phaseMode, deficitMethod))

  // --- Protein: bei hohem KF auf fettfreie Masse korrigiert -----------------
  const highBF = isHighBodyFat(sex, bodyFatPct)
  const leanMassKg = bodyFatPct != null ? weightKg * (1 - bodyFatPct / 100) : weightKg
  const proteinReferenceKg = highBF ? leanMassKg : weightKg
  const proteinFactor = highBF ? proteinPerKgLean : proteinPerKg
  const proteinG = round(proteinFactor * proteinReferenceKg)
  const proteinKcal = proteinG * 4

  // --- Fett: Anteil der kcal, aber mindestens 0,5 g/kg ----------------------
  const fatFromPctG = (targetKcalRounded * fatPctOfKcal) / 9
  const fatMinG = 0.5 * weightKg
  const fatPreciseG = Math.max(fatFromPctG, fatMinG)
  const fatKcal = fatPreciseG * 9
  const fatG = round(fatPreciseG)

  // --- Kohlenhydrate: Rest --------------------------------------------------
  const carbsG = Math.max(0, round((targetKcalRounded - proteinKcal - fatKcal) / 4))

  const calcNote =
    `BMR Mifflin ${round(bmr1)} + BMR Harris-Benedict ${round(bmr2)} → Ø ${round(bmrAvg)} ` +
    `× AF ${activityFactor} = TDEE ${round(tdee)} kcal → ${phaseModeLabel(phaseMode, deficitMethod)} ` +
    `= ${targetKcalRounded} kcal. ` +
    `Protein ${proteinFactor} g/kg auf ${round(proteinReferenceKg)} kg ` +
    `${highBF ? '(fettfreie Masse, KF-Korrektur)' : '(Körpergewicht)'} = ${proteinG} g. ` +
    `Fett ${Math.round(fatPctOfKcal * 100)} % / min. ${round(fatMinG)} g = ${fatG} g. KH = Rest ${carbsG} g.`

  return {
    bmr1: round(bmr1),
    bmr2: round(bmr2),
    bmrAvg: round(bmrAvg),
    tdee: round(tdee),
    maintenanceKcal: round(tdee),
    targetKcal: targetKcalRounded,
    proteinG,
    fatG,
    carbsG,
    mealsPerDay,
    proteinReferenceKg: round(proteinReferenceKg),
    highBodyFatCorrection: highBF,
    calcNote,
  }
}

function phaseModeLabel(mode: PhaseMode, method: DeficitMethod): string {
  if (mode === 'MAINTENANCE') return 'Erhalt (× 1,0)'
  if (mode === 'SURPLUS') return 'leichter Überschuss (× 1,1)'
  switch (method) {
    case 'AGGRESSIVE':
      return 'Defizit aggressiv (× 0,7)'
    case 'SIMPLE':
      return 'Defizit einfach (− 500)'
    default:
      return 'Defizit moderat (× 0,8)'
  }
}

// =============================================================================
// Refeed-SOLL (Fibel): kcal = Erhaltungskalorien, Protein 1,6 g/kg,
// Fett 0,5 g/kg, Kohlenhydrate = Rest. Skaliert mit dem Körpergewicht.
// (Wird in N-07 für Refeed-Tage genutzt; hier zentral definiert.)
// =============================================================================

export interface RefeedTargets {
  kcal: number
  proteinG: number
  fatG: number
  carbsG: number
}

export function computeRefeedTargets(maintenanceKcal: number, weightKg: number): RefeedTargets {
  const kcal = round(maintenanceKcal)
  const proteinG = round(1.6 * weightKg)
  const fatG = round(0.5 * weightKg)
  const carbsG = Math.max(0, round((kcal - proteinG * 4 - fatG * 9) / 4))
  return { kcal, proteinG, fatG, carbsG }
}
