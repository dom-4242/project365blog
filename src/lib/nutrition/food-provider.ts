// =============================================================================
// Food-Provider-Interface (Nutrition-Umbau, N-03)
//
// Kapselt externe Lebensmittel-Datenbanken hinter einer einheitlichen
// Schnittstelle. Erst-Implementierung: Open Food Facts (kostenlos, kein Key).
// Weitere Provider (z. B. FatSecret, key-basiert) sind später zuschaltbar —
// deshalb wird ausschliesslich über dieses Interface gearbeitet, und die
// Abfragen laufen serverseitig über Route Handler (Keys nie im Client).
// =============================================================================

import type { FoodSource } from '@prisma/client'

/**
 * Auf das interne FoodItem-Format normalisiertes Ergebnis eines Providers.
 * Nährwerte beziehen sich auf 100 Basiseinheiten (g/ml). Makros sind Pflicht
 * (fehlend → 0, im UI korrigierbar); Mikros sind best-effort und nullable.
 */
export interface NormalizedFood {
  name: string
  brand: string | null
  barcode: string | null
  baseUnit: string // 'g' | 'ml' | 'stück'
  source: FoodSource
  externalDbId: string | null

  // Makros je 100 Basiseinheiten
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number

  // Fokussierter Mikro-Satz je 100 Basiseinheiten (nullable)
  fiberG: number | null
  sugarG: number | null
  saturatedFatG: number | null
  sodiumMg: number | null
  potassiumMg: number | null
  ironMg: number | null
  magnesiumMg: number | null
  calciumMg: number | null
  zincMg: number | null
  vitaminDUg: number | null
  vitaminB12Ug: number | null
  vitaminCMg: number | null
}

export interface FoodProvider {
  /** Stabile Kennung (z. B. 'openfoodfacts'). */
  readonly id: string
  /** Freitext-Suche → Trefferliste (normalisiert). */
  searchByText(query: string, limit?: number): Promise<NormalizedFood[]>
  /** Barcode-Lookup → einzelnes Produkt oder null. */
  lookupByBarcode(barcode: string): Promise<NormalizedFood | null>
}
