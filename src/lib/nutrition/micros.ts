// =============================================================================
// Mikros-Aggregation (N-12) — fokussierter Mikro-Satz pro Tag, best-effort.
//
// Summiert die 12 Mikronährstoffe aus den MealEntry-Snapshots null-bewusst:
// Ein Wert bleibt `null`, wenn KEIN Eintrag ihn liefert (Lücke → in der Anzeige
// kenntlich gemacht). Liefert mindestens ein Eintrag den Wert, zählen fehlende
// Einträge als 0 (Notion-Spec Teil 3: „oft lückenhaft je nach Quelle").
// =============================================================================

import { MICRO_KEYS, type MicroKey } from './snapshot'

/** Anzeige-Metadaten je Mikro (Admin/Owner-Detail, DE). */
export interface MicroMeta {
  key: MicroKey
  label: string
  unit: string
  /** Gruppierung für die Anzeige. */
  group: 'submakro' | 'mineral' | 'vitamin'
}

export const MICRO_META: MicroMeta[] = [
  { key: 'fiberG', label: 'Ballaststoffe', unit: 'g', group: 'submakro' },
  { key: 'sugarG', label: 'Zucker', unit: 'g', group: 'submakro' },
  { key: 'saturatedFatG', label: 'Gesättigte Fette', unit: 'g', group: 'submakro' },
  { key: 'sodiumMg', label: 'Natrium', unit: 'mg', group: 'mineral' },
  { key: 'potassiumMg', label: 'Kalium', unit: 'mg', group: 'mineral' },
  { key: 'ironMg', label: 'Eisen', unit: 'mg', group: 'mineral' },
  { key: 'magnesiumMg', label: 'Magnesium', unit: 'mg', group: 'mineral' },
  { key: 'calciumMg', label: 'Calcium', unit: 'mg', group: 'mineral' },
  { key: 'zincMg', label: 'Zink', unit: 'mg', group: 'mineral' },
  { key: 'vitaminDUg', label: 'Vitamin D', unit: 'µg', group: 'vitamin' },
  { key: 'vitaminB12Ug', label: 'Vitamin B12', unit: 'µg', group: 'vitamin' },
  { key: 'vitaminCMg', label: 'Vitamin C', unit: 'mg', group: 'vitamin' },
]

export type MicroTotals = Record<MicroKey, number | null>

export type MicroSource = Partial<Record<MicroKey, number | null>>

const r2 = (n: number) => Math.round(n * 100) / 100

/**
 * Null-bewusste Tagessumme der Mikros aus MealEntry-Snapshots.
 * `null` bleibt nur, wenn kein Eintrag den Wert liefert.
 */
export function aggregateMicros(entries: MicroSource[]): MicroTotals {
  const out = {} as MicroTotals
  for (const key of MICRO_KEYS) {
    let sum = 0
    let seen = false
    for (const e of entries) {
      const v = e[key]
      if (v != null) {
        sum += v
        seen = true
      }
    }
    out[key] = seen ? r2(sum) : null
  }
  return out
}

/** Wie viele der 12 Mikros für den Tag Daten haben (für Vollständigkeits-Hinweis). */
export function microCoverage(totals: MicroTotals): { present: number; total: number } {
  let present = 0
  for (const key of MICRO_KEYS) if (totals[key] != null) present++
  return { present, total: MICRO_KEYS.length }
}
