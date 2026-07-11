// =============================================================================
// Ampel-Indikator für die Tagesbilanz (Loggen-Seite).
//
// Reine, testbare Bewertung IST vs. SOLL je Kennzahl — bewusst tag-typ- und
// nährstoff-abhängig, damit die Farbe nicht in die Irre führt:
//   • kcal   → Erfüllungslogik: Defizit „unter SOLL = gut", sonst ±5 %-Band
//   • Protein→ Zieluntergrenze („mehr ist besser", Ziel erreichen)
//   • KH/Fett→ im Defizit Budget/Obergrenze („unter = gut"), sonst ±-Band
//
// Grün = im Ziel, Gelb = knapp daneben (Toleranz), Rot = klar daneben.
// =============================================================================

export type Tone = 'good' | 'warn' | 'bad'

/** Toleranzband der Erfüllung (±5 %), analog fulfillment.ts. */
const TOL = 0.05

/** kcal-Ampel, tag-typ-abhängig (isDeficitDay = Phase DEFICIT und kein Refeed). */
export function kcalTone(ist: number, soll: number, isDeficitDay: boolean): Tone {
  if (soll <= 0) return 'warn'
  if (isDeficitDay) {
    if (ist <= soll) return 'good'
    if (ist <= soll * (1 + TOL)) return 'warn'
    return 'bad'
  }
  const dev = Math.abs(ist - soll) / soll
  if (dev <= TOL) return 'good'
  if (dev <= 2 * TOL) return 'warn'
  return 'bad'
}

/** Protein: Zieluntergrenze — Ziel treffen/überschreiten ist gut. */
export function proteinTone(ist: number, soll: number): Tone {
  if (soll <= 0) return 'warn'
  const ratio = ist / soll
  if (ratio >= 0.9) return 'good'
  if (ratio >= 0.7) return 'warn'
  return 'bad'
}

/**
 * KH/Fett: im Defizit als Budget/Obergrenze („unter oder nah = gut"),
 * sonst symmetrisches Nähe-Band ums SOLL.
 */
export function budgetTone(ist: number, soll: number, isDeficitDay: boolean): Tone {
  if (soll <= 0) return 'warn'
  if (isDeficitDay) {
    if (ist <= soll * (1 + TOL)) return 'good'
    if (ist <= soll * (1 + 3 * TOL)) return 'warn'
    return 'bad'
  }
  const dev = Math.abs(ist - soll) / soll
  if (dev <= 2 * TOL) return 'good'
  if (dev <= 5 * TOL) return 'warn'
  return 'bad'
}

// Hinweis: Die Tailwind-Klassen je Tone werden bewusst in der Komponente
// (src/components/…) gehalten — nur dort greift der Tailwind-Content-Scan.
