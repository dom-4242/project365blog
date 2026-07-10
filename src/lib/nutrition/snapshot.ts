// =============================================================================
// Nährwert-Snapshot (Nutrition-Umbau, N-05)
//
// Reine Skalierungs-Mathematik für MealEntry-Snapshots. FoodItem-Nährwerte
// beziehen sich auf 100 Basiseinheiten (g/ml/stück) → Faktor = Menge / 100.
// Der berechnete Snapshot wird am MealEntry immutabel gespeichert (Katalog-
// Korrekturen wirken nur auf zukünftige Logs).
// =============================================================================

/** Die 12 fokussierten Mikronährstoffe (Reihenfolge = FoodItem-Felder). */
export const MICRO_KEYS = [
  'fiberG',
  'sugarG',
  'saturatedFatG',
  'sodiumMg',
  'potassiumMg',
  'ironMg',
  'magnesiumMg',
  'calciumMg',
  'zincMg',
  'vitaminDUg',
  'vitaminB12Ug',
  'vitaminCMg',
] as const

export type MicroKey = (typeof MICRO_KEYS)[number]

/** Makros je 100 Basiseinheiten (Pflicht) + Mikros (nullable). */
export interface NutrientSource {
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG?: number | null
  sugarG?: number | null
  saturatedFatG?: number | null
  sodiumMg?: number | null
  potassiumMg?: number | null
  ironMg?: number | null
  magnesiumMg?: number | null
  calciumMg?: number | null
  zincMg?: number | null
  vitaminDUg?: number | null
  vitaminB12Ug?: number | null
  vitaminCMg?: number | null
}

export type NutrientSnapshot = {
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
} & Record<MicroKey, number | null>

interface RawNutrients {
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  micros: Record<MicroKey, number | null>
}

const r1 = (n: number) => Math.round(n * 10) / 10
const r2 = (n: number) => Math.round(n * 100) / 100

/** Null-bewusste Addition: null + null = null, sonst als 0 behandeln. */
function addNullable(a: number | null, b: number | null): number | null {
  if (a == null && b == null) return null
  return (a ?? 0) + (b ?? 0)
}

function rawScale(food: NutrientSource, amount: number): RawNutrients {
  const f = amount / 100
  const micros = {} as Record<MicroKey, number | null>
  for (const k of MICRO_KEYS) {
    const v = food[k]
    micros[k] = v == null ? null : v * f
  }
  return {
    kcal: food.kcal * f,
    proteinG: food.proteinG * f,
    carbsG: food.carbsG * f,
    fatG: food.fatG * f,
    micros,
  }
}

function scaleRaw(raw: RawNutrients, factor: number): RawNutrients {
  const micros = {} as Record<MicroKey, number | null>
  for (const k of MICRO_KEYS) {
    const v = raw.micros[k]
    micros[k] = v == null ? null : v * factor
  }
  return {
    kcal: raw.kcal * factor,
    proteinG: raw.proteinG * factor,
    carbsG: raw.carbsG * factor,
    fatG: raw.fatG * factor,
    micros,
  }
}

function emptyRaw(): RawNutrients {
  const micros = {} as Record<MicroKey, number | null>
  for (const k of MICRO_KEYS) micros[k] = null
  return { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, micros }
}

function addRaw(a: RawNutrients, b: RawNutrients): RawNutrients {
  const micros = {} as Record<MicroKey, number | null>
  for (const k of MICRO_KEYS) micros[k] = addNullable(a.micros[k], b.micros[k])
  return {
    kcal: a.kcal + b.kcal,
    proteinG: a.proteinG + b.proteinG,
    carbsG: a.carbsG + b.carbsG,
    fatG: a.fatG + b.fatG,
    micros,
  }
}

function roundSnapshot(raw: RawNutrients): NutrientSnapshot {
  const out = {
    kcal: r1(raw.kcal),
    proteinG: r1(raw.proteinG),
    carbsG: r1(raw.carbsG),
    fatG: r1(raw.fatG),
  } as NutrientSnapshot
  for (const k of MICRO_KEYS) {
    const v = raw.micros[k]
    out[k] = v == null ? null : r2(v)
  }
  return out
}

/** Einzel-Lebensmittel: Nährwerte für `amount` Basiseinheiten. */
export function scaleNutrients(food: NutrientSource, amount: number): NutrientSnapshot {
  return roundSnapshot(rawScale(food, amount))
}

export interface DishComponent {
  food: NutrientSource
  amount: number // in Basiseinheiten des FoodItems
}

/**
 * Gericht: Summe aller Zutaten (× optionalem Portions-Multiplikator).
 * Mikros werden null-bewusst summiert (fehlende Zutat-Werte zählen als 0,
 * Ergebnis nur null, wenn keine Zutat den Wert liefert).
 */
export function dishSnapshot(components: DishComponent[], multiplier = 1): NutrientSnapshot {
  const total = components.reduce(
    (acc, c) => addRaw(acc, rawScale(c.food, c.amount)),
    emptyRaw(),
  )
  return roundSnapshot(scaleRaw(total, multiplier))
}
