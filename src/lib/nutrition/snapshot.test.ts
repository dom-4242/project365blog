import { describe, it, expect } from 'vitest'
import { scaleNutrients, dishSnapshot, type NutrientSource } from './snapshot'

// Magerquark je 100 g
const QUARK: NutrientSource = {
  kcal: 67,
  proteinG: 12,
  carbsG: 4,
  fatG: 0.3,
  calciumMg: 92,
  sodiumMg: 40,
  vitaminB12Ug: 0.8,
  // restliche Mikros absichtlich weggelassen (undefined → null)
}

// Haferflocken je 100 g
const OATS: NutrientSource = {
  kcal: 372,
  proteinG: 13.5,
  carbsG: 59,
  fatG: 7,
  fiberG: 10,
  ironMg: 4.6,
}

describe('scaleNutrients — Einzel-Lebensmittel', () => {
  it('skaliert linear mit der Menge (250 g Quark)', () => {
    const s = scaleNutrients(QUARK, 250)
    expect(s.kcal).toBe(167.5) // 67 × 2,5
    expect(s.proteinG).toBe(30) // 12 × 2,5
    expect(s.carbsG).toBe(10)
    expect(s.fatG).toBe(0.8) // 0,3 × 2,5 = 0,75 → 0,8
    expect(s.calciumMg).toBe(230) // 92 × 2,5
    expect(s.vitaminB12Ug).toBe(2) // 0,8 × 2,5
  })

  it('100 g = unveränderte Basiswerte', () => {
    const s = scaleNutrients(QUARK, 100)
    expect(s.kcal).toBe(67)
    expect(s.proteinG).toBe(12)
  })

  it('nicht gesetzte Mikros bleiben null', () => {
    const s = scaleNutrients(QUARK, 250)
    expect(s.fiberG).toBeNull()
    expect(s.ironMg).toBeNull()
  })

  it('0 g → alles 0 bzw. null', () => {
    const s = scaleNutrients(QUARK, 0)
    expect(s.kcal).toBe(0)
    expect(s.proteinG).toBe(0)
    expect(s.calciumMg).toBe(0)
    expect(s.fiberG).toBeNull()
  })
})

describe('dishSnapshot — Gericht (Quark + Haferflocken)', () => {
  const components = [
    { food: QUARK, amount: 250 }, // 167,5 kcal / 30 P / 10 KH / 0,75 F
    { food: OATS, amount: 60 }, // 223,2 kcal / 8,1 P / 35,4 KH / 4,2 F
  ]

  it('summiert die Zutaten korrekt', () => {
    const s = dishSnapshot(components)
    expect(s.kcal).toBe(390.7) // 167,5 + 223,2
    expect(s.proteinG).toBe(38.1) // 30 + 8,1
    expect(s.carbsG).toBe(45.4) // 10 + 35,4
    expect(s.fatG).toBe(5) // 0,75 + 4,2 = 4,95 → 5,0
  })

  it('Mikros null-bewusst: vorhandene Werte summieren, sonst null', () => {
    const s = dishSnapshot(components)
    // Ballaststoffe nur in Oats (10 g × 0,6 = 6), Quark liefert nichts → 6
    expect(s.fiberG).toBe(6)
    // Calcium nur in Quark (92 × 2,5 = 230), Oats liefert nichts → 230
    expect(s.calciumMg).toBe(230)
    // Eisen nur in Oats (4,6 × 0,6 = 2,76)
    expect(s.ironMg).toBe(2.76)
    // Magnesium in keiner Zutat → null
    expect(s.magnesiumMg).toBeNull()
  })

  it('Portions-Multiplikator skaliert das ganze Gericht', () => {
    const single = dishSnapshot(components, 1)
    const dbl = dishSnapshot(components, 2)
    expect(dbl.kcal).toBe(Math.round(single.kcal * 2 * 10) / 10)
    expect(dbl.proteinG).toBe(Math.round(single.proteinG * 2 * 10) / 10)
    expect(dbl.fiberG).toBe(12) // 6 × 2
  })

  it('leeres Gericht → 0/null', () => {
    const s = dishSnapshot([])
    expect(s.kcal).toBe(0)
    expect(s.fiberG).toBeNull()
  })
})
