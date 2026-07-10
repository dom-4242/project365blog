import { describe, it, expect } from 'vitest'
import { parseEstimate } from './vision'

describe('parseEstimate — robustes JSON-Parsing der Vision-Antwort', () => {
  it('parst sauberes JSON', () => {
    const e = parseEstimate('{"dishName":"Pad Thai","kcal":650,"proteinG":30,"carbsG":80,"fatG":22,"confidence":0.7,"note":"grosse Portion"}')
    expect(e.dishName).toBe('Pad Thai')
    expect(e.kcal).toBe(650)
    expect(e.proteinG).toBe(30)
    expect(e.confidence).toBe(0.7)
    expect(e.note).toBe('grosse Portion')
  })

  it('extrahiert JSON aus Markdown-/Fliesstext-Umgebung', () => {
    const e = parseEstimate('Hier die Schätzung:\n```json\n{"dishName":"Salat","kcal":320,"proteinG":12,"carbsG":18,"fatG":20,"confidence":0.55}\n```\nViel Erfolg!')
    expect(e.dishName).toBe('Salat')
    expect(e.kcal).toBe(320)
  })

  it('rundet und verhindert negative Werte', () => {
    const e = parseEstimate('{"dishName":"X","kcal":"512.37","proteinG":-5,"carbsG":40,"fatG":10,"confidence":0.5}')
    expect(e.kcal).toBe(512.4)
    expect(e.proteinG).toBe(0) // negativ → 0
  })

  it('klemmt Konfidenz auf 0..1', () => {
    expect(parseEstimate('{"dishName":"X","kcal":1,"proteinG":1,"carbsG":1,"fatG":1,"confidence":1.8}').confidence).toBe(1)
    expect(parseEstimate('{"dishName":"X","kcal":1,"proteinG":1,"carbsG":1,"fatG":1,"confidence":-2}').confidence).toBe(0)
    expect(parseEstimate('{"dishName":"X","kcal":1,"proteinG":1,"carbsG":1,"fatG":1}').confidence).toBe(0.5) // fehlt → default
  })

  it('setzt Default-Namen bei fehlendem dishName', () => {
    const e = parseEstimate('{"kcal":100,"proteinG":5,"carbsG":10,"fatG":3}')
    expect(e.dishName).toBe('Geschätzte Mahlzeit')
  })

  it('wirft bei fehlendem JSON', () => {
    expect(() => parseEstimate('Kein JSON hier.')).toThrow()
  })

  it('behält die rohe Antwort für die Speicherung (aiAnalysis)', () => {
    const e = parseEstimate('{"dishName":"Y","kcal":200,"proteinG":8,"carbsG":20,"fatG":6,"confidence":0.6,"foo":"bar"}')
    expect((e.raw as Record<string, unknown>).foo).toBe('bar')
  })
})
