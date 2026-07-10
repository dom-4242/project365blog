import { describe, it, expect } from 'vitest'
import {
  computeEckdaten,
  computeRefeedTargets,
  bmrMifflin,
  bmrHarrisBenedict,
  targetKcalFromTdee,
  isHighBodyFat,
  type EckdatenInput,
} from './calc'

// Referenz-Eingaben aus der Fibel-Eckdaten-Page (Dom, Stand 2026-07-08)
const DOM: EckdatenInput = {
  weightKg: 94,
  heightCm: 170,
  age: 43,
  sex: 'MALE',
  bodyFatPct: 27,
  activityFactor: 1.55,
  phaseMode: 'DEFICIT',
  deficitMethod: 'MODERATE',
}

describe('BMR-Formeln', () => {
  it('Mifflin-St-Jeor (♂) reproduziert 1793', () => {
    expect(Math.round(bmrMifflin(94, 170, 43, 'MALE'))).toBe(1793)
  })

  it('Harris-Benedict überarbeitet (♂) reproduziert 1919', () => {
    expect(Math.round(bmrHarrisBenedict(94, 170, 43, 'MALE'))).toBe(1919)
  })

  it('Frauen-Formeln weichen ab (−161 bzw. eigene Konstanten)', () => {
    expect(bmrMifflin(60, 165, 30, 'FEMALE')).toBeCloseTo(10 * 60 + 6.25 * 165 - 5 * 30 - 161, 3)
    expect(bmrHarrisBenedict(60, 165, 30, 'FEMALE')).toBeGreaterThan(1300)
  })
})

describe('computeEckdaten — Fibel-Referenzbeispiel', () => {
  const r = computeEckdaten(DOM)

  it('BMR-Mittel = 1856', () => expect(r.bmrAvg).toBe(1856))
  it('TDEE (Erhaltungskalorien) = 2877', () => expect(r.tdee).toBe(2877))
  it('Ziel-kcal (20 % Defizit) = 2301', () => expect(r.targetKcal).toBe(2301))
  it('Protein = 185 g (Zielgewicht/FFM-Korrektur bei hohem KF)', () =>
    expect(r.proteinG).toBe(185))
  it('Fett = 51 g (20 %, > Minimum 47 g)', () => expect(r.fatG).toBe(51))
  it('Kohlenhydrate = 275 g (Rest)', () => expect(r.carbsG).toBe(275))
  it('Mahlzeiten = 4', () => expect(r.mealsPerDay).toBe(4))
  it('KF-Korrektur greift und bezieht sich auf ~69 kg fettfreie Masse', () => {
    expect(r.highBodyFatCorrection).toBe(true)
    expect(r.proteinReferenceKg).toBe(69) // 94 × (1 − 0,27) = 68,62 → 69
  })
  it('Makro-kcal summieren ~ auf Ziel-kcal (Rundungstoleranz)', () => {
    const macroKcal = r.proteinG * 4 + r.fatG * 9 + r.carbsG * 4
    expect(Math.abs(macroKcal - r.targetKcal)).toBeLessThanOrEqual(6)
  })
})

describe('Defizit-Methoden & Phasen-Modi', () => {
  it('aggressiv = TDEE × 0,7', () => {
    expect(targetKcalFromTdee(2877, 'DEFICIT', 'AGGRESSIVE')).toBeCloseTo(2013.9, 1)
  })
  it('einfach = TDEE − 500', () => {
    expect(targetKcalFromTdee(2877, 'DEFICIT', 'SIMPLE')).toBe(2377)
  })
  it('Erhalt = TDEE (Defizit-Methode ignoriert)', () => {
    expect(targetKcalFromTdee(2877, 'MAINTENANCE', 'MODERATE')).toBe(2877)
  })
  it('leichter Überschuss = TDEE × 1,1', () => {
    expect(targetKcalFromTdee(2877, 'SURPLUS', 'MODERATE')).toBeCloseTo(3164.7, 1)
  })
  it('Erhalt-Phase liefert Ziel = Erhaltungskalorien', () => {
    const r = computeEckdaten({ ...DOM, phaseMode: 'MAINTENANCE' })
    expect(r.targetKcal).toBe(r.tdee)
  })
})

describe('Protein-Korrektur & Fett-Minimum', () => {
  it('ohne KF-Angabe: Protein auf volles Körpergewicht (2,2 g/kg)', () => {
    const r = computeEckdaten({ ...DOM, bodyFatPct: null })
    expect(r.highBodyFatCorrection).toBe(false)
    expect(r.proteinReferenceKg).toBe(94)
    expect(r.proteinG).toBe(Math.round(2.2 * 94)) // 207
  })
  it('niedriger KF (unter Schwelle): keine Korrektur', () => {
    expect(isHighBodyFat('MALE', 18)).toBe(false)
    const r = computeEckdaten({ ...DOM, bodyFatPct: 18 })
    expect(r.highBodyFatCorrection).toBe(false)
  })
  it('Fett-Minimum 0,5 g/kg greift bei sehr niedrigem Fett-Prozentsatz', () => {
    const r = computeEckdaten({ ...DOM, fatPctOfKcal: 0.05 })
    expect(r.fatG).toBeGreaterThanOrEqual(Math.round(0.5 * DOM.weightKg)) // >= 47
  })
})

describe('computeRefeedTargets — Fibel-Formel', () => {
  it('reproduziert Dom-Beispiel: 2877 kcal → 150 P / 47 F / 464 KH', () => {
    const r = computeRefeedTargets(2877, 94)
    expect(r.kcal).toBe(2877)
    expect(r.proteinG).toBe(150) // 1,6 × 94
    expect(r.fatG).toBe(47) // 0,5 × 94
    expect(r.carbsG).toBe(464) // Rest
  })
})
