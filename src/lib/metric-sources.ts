// =============================================
// Source of Truth — verbindliche Zuordnung Metrik → autoritative Quelle
//
// Mehrere Quellen liefern überlappende Werte (z.B. Gewicht sowohl von Withings
// als auch — theoretisch — von MyFitnessPal; Schritte von Apple Watch, aber MFP
// exportiert ebenfalls Schritte). Diese Registry legt EINDEUTIG fest, welche
// Quelle für welche Metrik maßgeblich ist, damit nichts doppelt zählt oder aus
// der falschen Quelle gelesen wird.
//
// Genutzt vom Health-Inventar (Kennzeichnung „autoritativ") und später vom
// Kaloriendefizit-Dashboard (caloriesIn[MFP] vs. TDEE = bmr[Withings] +
// activeEnergy[Apple Health]).
// =============================================

export type SourceId = 'APPLE_HEALTH' | 'WITHINGS' | 'MYFITNESSPAL'

/** Canonical metric → authoritative source. */
export const METRIC_SOURCE_OF_TRUTH = {
  // Aktivität — nur Apple Watch
  steps: 'APPLE_HEALTH',
  activeEnergy: 'APPLE_HEALTH',
  restingHR: 'APPLE_HEALTH',
  // Körper — nur Withings Body Scan
  weight: 'WITHINGS',
  bodyFat: 'WITHINGS',
  bodyComposition: 'WITHINGS', // Muskel, Wasser, Knochen, viszeral, segmental …
  bmr: 'WITHINGS',             // Grundumsatz (type 226) → fürs TDEE
  // Ernährung — nur MyFitnessPal
  caloriesIn: 'MYFITNESSPAL',
  macros: 'MYFITNESSPAL',      // Protein / Carbs / Fat / Fiber / Sugar / Sodium
  micros: 'MYFITNESSPAL',
} as const satisfies Record<string, SourceId>

export type CanonicalMetric = keyof typeof METRIC_SOURCE_OF_TRUTH

/** Which source is authoritative for a canonical metric. */
export function sourceOfTruth(metric: CanonicalMetric): SourceId {
  return METRIC_SOURCE_OF_TRUTH[metric]
}

/** True if `source` is the authoritative provider for `metric`. */
export function isAuthoritative(metric: CanonicalMetric, source: SourceId): boolean {
  return METRIC_SOURCE_OF_TRUTH[metric] === source
}
