import { describe, it, expect } from 'vitest'
import { mapOffProduct } from './open-food-facts'

const SAMPLE = {
  code: '4008400202037',
  product_name: 'Testprodukt',
  brands: 'MarkeA, MarkeB',
  nutriments: {
    'energy-kcal_100g': 250,
    proteins_100g: 12,
    carbohydrates_100g: 30,
    fat_100g: 8,
    fiber_100g: 3,
    sugars_100g: 5,
    'saturated-fat_100g': 2,
    sodium_100g: 0.5, // g → 500 mg
    potassium_100g: 0.35, // g → 350 mg
    iron_100g: 0.0014, // g → 1,4 mg
    magnesium_100g: 0.025, // g → 25 mg
    calcium_100g: 0.12, // g → 120 mg
    zinc_100g: 0.004, // g → 4 mg
    'vitamin-d_100g': 0.0000051, // g → 5,1 µg
    'vitamin-b12_100g': 0.0000024, // g → 2,4 µg
    'vitamin-c_100g': 0.0533, // g → 53,3 mg
  },
}

describe('mapOffProduct', () => {
  const f = mapOffProduct(SAMPLE)!

  it('übernimmt Name, erste Marke, Barcode und Quelle', () => {
    expect(f.name).toBe('Testprodukt')
    expect(f.brand).toBe('MarkeA')
    expect(f.barcode).toBe('4008400202037')
    expect(f.source).toBe('EXTERNAL_DB')
    expect(f.externalDbId).toBe('4008400202037')
    expect(f.baseUnit).toBe('g')
  })

  it('übernimmt Makros je 100 g', () => {
    expect(f.kcal).toBe(250)
    expect(f.proteinG).toBe(12)
    expect(f.carbsG).toBe(30)
    expect(f.fatG).toBe(8)
  })

  it('übernimmt Sub-Makros (g)', () => {
    expect(f.fiberG).toBe(3)
    expect(f.sugarG).toBe(5)
    expect(f.saturatedFatG).toBe(2)
  })

  it('rechnet Mineralstoffe von g auf mg um', () => {
    expect(f.sodiumMg).toBe(500)
    expect(f.potassiumMg).toBe(350)
    expect(f.ironMg).toBe(1.4)
    expect(f.magnesiumMg).toBe(25)
    expect(f.calciumMg).toBe(120)
    expect(f.zincMg).toBe(4)
  })

  it('rechnet Vitamine korrekt um (D/B12 → µg, C → mg)', () => {
    expect(f.vitaminDUg).toBe(5.1)
    expect(f.vitaminB12Ug).toBe(2.4)
    expect(f.vitaminCMg).toBe(53.3)
  })

  it('setzt fehlende Mikros auf null', () => {
    const g = mapOffProduct({
      code: '111',
      product_name: 'Nur Makros',
      nutriments: { 'energy-kcal_100g': 100, proteins_100g: 5, carbohydrates_100g: 10, fat_100g: 2 },
    })!
    expect(g.fiberG).toBeNull()
    expect(g.calciumMg).toBeNull()
    expect(g.vitaminDUg).toBeNull()
  })

  it('rechnet Energie aus kJ um, wenn kcal fehlt', () => {
    const g = mapOffProduct({
      code: '222',
      product_name: 'kJ only',
      nutriments: { energy_100g: 1046, proteins_100g: 0, carbohydrates_100g: 0, fat_100g: 0 },
    })!
    expect(g.kcal).toBeCloseTo(250, 0)
  })

  it('fehlende Makros → 0 (im UI korrigierbar)', () => {
    const g = mapOffProduct({ code: '333', product_name: 'Leer', nutriments: {} })!
    expect(g.kcal).toBe(0)
    expect(g.proteinG).toBe(0)
  })

  it('ohne Name und Barcode → null', () => {
    expect(mapOffProduct({ nutriments: {} })).toBeNull()
  })

  it('Barcode ohne Name → Fallback-Name', () => {
    const g = mapOffProduct({ code: '999', nutriments: {} })!
    expect(g.name).toContain('999')
  })
})
