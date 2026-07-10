// =============================================================================
// Open Food Facts Provider (N-03)
//
// OFF liefert Nährwerte im `nutriments`-Objekt je 100 g/ml. Massenährstoffe
// (`*_100g`) sind in GRAMM normalisiert — Mikros werden daher auf mg/µg
// umgerechnet. Energie separat als `energy-kcal_100g` (kcal).
//
// Kein API-Key nötig. OFF bittet um einen aussagekräftigen User-Agent.
// =============================================================================

import type { FoodProvider, NormalizedFood } from '../food-provider'

const OFF_BASE = 'https://world.openfoodfacts.org'
const USER_AGENT = 'Project365/1.0 (https://project365.dom42.ch)'

// Nur benötigte Felder anfordern (kleinere Payload)
const FIELDS = [
  'code',
  'product_name',
  'generic_name',
  'brands',
  'quantity',
  'nutriments',
].join(',')

interface OffProduct {
  code?: string
  product_name?: string
  generic_name?: string
  brands?: string
  quantity?: string
  nutriments?: Record<string, unknown>
}

/** Roh-Wert eines Nutriments als Zahl (oder null). */
function num(nutriments: Record<string, unknown>, key: string): number | null {
  const v = nutriments[key]
  if (v === undefined || v === null || v === '') return null
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return isNaN(n) ? null : n
}

/** Gramm → mg (× 1000). */
function gToMg(g: number | null): number | null {
  return g === null ? null : Math.round(g * 1000 * 100) / 100
}
/** Gramm → µg (× 1_000_000). */
function gToUg(g: number | null): number | null {
  return g === null ? null : Math.round(g * 1_000_000 * 100) / 100
}
/** Auf 2 Nachkommastellen runden (oder null). */
function r2(n: number | null): number | null {
  return n === null ? null : Math.round(n * 100) / 100
}

function firstBrand(brands?: string): string | null {
  if (!brands) return null
  const first = brands.split(',')[0]?.trim()
  return first || null
}

/**
 * Reine Abbildung eines OFF-Produkts auf das interne NormalizedFood-Format.
 * Gibt null zurück, wenn weder Name noch Barcode brauchbar sind.
 */
export function mapOffProduct(product: OffProduct): NormalizedFood | null {
  const name = (product.product_name || product.generic_name || '').trim()
  const barcode = product.code?.trim() || null
  if (!name && !barcode) return null

  const n = product.nutriments ?? {}

  // Energie: bevorzugt kcal-Feld, sonst aus kJ umrechnen
  let kcal = num(n, 'energy-kcal_100g')
  if (kcal === null) {
    const kj = num(n, 'energy_100g')
    kcal = kj === null ? 0 : Math.round((kj / 4.184) * 10) / 10
  }

  return {
    name: name || `Produkt ${barcode}`,
    brand: firstBrand(product.brands),
    barcode,
    baseUnit: 'g', // OFF unterscheidet g/ml nicht zuverlässig → Default, im UI korrigierbar
    source: 'EXTERNAL_DB',
    externalDbId: barcode,

    kcal: kcal ?? 0,
    proteinG: r2(num(n, 'proteins_100g')) ?? 0,
    carbsG: r2(num(n, 'carbohydrates_100g')) ?? 0,
    fatG: r2(num(n, 'fat_100g')) ?? 0,

    fiberG: r2(num(n, 'fiber_100g')),
    sugarG: r2(num(n, 'sugars_100g')),
    saturatedFatG: r2(num(n, 'saturated-fat_100g')),
    sodiumMg: gToMg(num(n, 'sodium_100g')),
    potassiumMg: gToMg(num(n, 'potassium_100g')),
    ironMg: gToMg(num(n, 'iron_100g')),
    magnesiumMg: gToMg(num(n, 'magnesium_100g')),
    calciumMg: gToMg(num(n, 'calcium_100g')),
    zincMg: gToMg(num(n, 'zinc_100g')),
    vitaminDUg: gToUg(num(n, 'vitamin-d_100g')),
    vitaminB12Ug: gToUg(num(n, 'vitamin-b12_100g')),
    vitaminCMg: gToMg(num(n, 'vitamin-c_100g')),
  }
}

async function offFetch(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    // OFF-Daten sind wenig volatil; kurzer Cache entlastet die API
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`OFF request failed: ${res.status}`)
  return res.json()
}

export class OpenFoodFactsProvider implements FoodProvider {
  readonly id = 'openfoodfacts'

  async searchByText(query: string, limit = 20): Promise<NormalizedFood[]> {
    const q = query.trim()
    if (!q) return []
    const url =
      `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(q)}` +
      `&search_simple=1&action=process&json=1&page_size=${limit}&fields=${FIELDS}`
    const data = (await offFetch(url)) as { products?: OffProduct[] }
    const products = Array.isArray(data.products) ? data.products : []
    return products
      .map(mapOffProduct)
      .filter((f): f is NormalizedFood => f !== null)
  }

  async lookupByBarcode(barcode: string): Promise<NormalizedFood | null> {
    const code = barcode.trim()
    if (!code) return null
    const url = `${OFF_BASE}/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`
    const data = (await offFetch(url)) as { status?: number; product?: OffProduct }
    if (data.status !== 1 || !data.product) return null
    return mapOffProduct(data.product)
  }
}

export const openFoodFacts = new OpenFoodFactsProvider()
