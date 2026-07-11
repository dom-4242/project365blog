import { describe, it, expect } from 'vitest'
import { parseLabelNutrients } from './vision'

describe('parseLabelNutrients', () => {
  it('parses per-100 macros and micros, nulling absent micros', () => {
    const json = JSON.stringify({
      name: 'Magerquark',
      brand: 'Migros',
      baseUnit: 'g',
      kcal: 67,
      proteinG: 12,
      carbsG: 4,
      fatG: 0.2,
      fiberG: 0,
      sugarG: 4,
      saturatedFatG: 0.1,
      sodiumMg: 40,
      calciumMg: 120,
      confidence: 0.9,
      note: 'pro 100 g',
    })
    const r = parseLabelNutrients(json)
    expect(r.name).toBe('Magerquark')
    expect(r.brand).toBe('Migros')
    expect(r.baseUnit).toBe('g')
    expect(r.kcal).toBe(67)
    expect(r.proteinG).toBe(12)
    expect(r.calciumMg).toBe(120)
    // not present in JSON -> null
    expect(r.ironMg).toBeNull()
    expect(r.vitaminB12Ug).toBeNull()
    expect(r.confidence).toBe(0.9)
  })

  it('defaults baseUnit to g and tolerates surrounding text', () => {
    const r = parseLabelNutrients('hier: {"baseUnit":"unknown","kcal":42,"proteinG":1,"carbsG":10,"fatG":0} fertig')
    expect(r.baseUnit).toBe('g')
    expect(r.kcal).toBe(42)
  })

  it('recognises ml base unit for drinks', () => {
    const r = parseLabelNutrients('{"baseUnit":"ml","kcal":0,"proteinG":0,"carbsG":0,"fatG":0}')
    expect(r.baseUnit).toBe('ml')
  })

  it('clamps negative values and non-numeric micros to safe values', () => {
    const r = parseLabelNutrients('{"kcal":-5,"proteinG":"abc","carbsG":0,"fatG":0,"ironMg":"n/a"}')
    expect(r.kcal).toBe(0)
    expect(r.proteinG).toBe(0)
    expect(r.ironMg).toBeNull()
  })

  it('throws on non-JSON', () => {
    expect(() => parseLabelNutrients('kein json hier')).toThrow()
  })
})
