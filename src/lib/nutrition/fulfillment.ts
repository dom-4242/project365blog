// =============================================================================
// Erfüllungs-Logik (Nutrition-Umbau, N-07) — rein & testbar.
//
// Tag-typ-abhängig mit Toleranz ±5 % der Ziel-kcal (Notion-Spec Teil 3):
//   • Defizit-Tag:            erfüllt, wenn IST ≤ SOLL × 1,05
//   • Erhalt/Überschuss/Refeed: erfüllt, wenn IST im Band SOLL ±5 %
//   • Ohne geloggte Einträge oder ohne gültige Eckdaten: OFFEN
// =============================================================================

export type FulfillmentStatus = 'FULFILLED' | 'NOT_FULFILLED' | 'OPEN'

/** Toleranz der Ziel-kcal. */
export const KCAL_TOLERANCE = 0.05

/** JS getUTCDay() (0=So..6=Sa) → ISO-Wochentag (1=Mo..7=So). */
export function isoWeekday(date: Date): number {
  return ((date.getUTCDay() + 6) % 7) + 1
}

export interface RefeedRuleLike {
  active: boolean
  recurringWeekdays: number[]
}

/** Trifft der Wochentag eine aktive, wiederkehrende Refeed-Regel? */
export function matchesRecurringRefeed(weekdayIso: number, rules: RefeedRuleLike[]): boolean {
  return rules.some((r) => r.active && r.recurringWeekdays.includes(weekdayIso))
}

/**
 * Effektiver Refeed-Status: ad-hoc (Tag explizit als Refeed markiert) ODER
 * ein wiederkehrender Wochentag einer aktiven Regel.
 */
export function effectiveIsRefeed(
  dayMarkedRefeed: boolean,
  weekdayIso: number,
  rules: RefeedRuleLike[],
): boolean {
  return dayMarkedRefeed || matchesRecurringRefeed(weekdayIso, rules)
}

export interface FulfillmentArgs {
  istKcal: number
  sollKcal: number | null
  /** true nur bei echtem Defizit-Tag (Phase DEFICIT und KEIN Refeed). */
  isDeficitDay: boolean
  hasEntries: boolean
}

export function evaluateFulfillment({
  istKcal,
  sollKcal,
  isDeficitDay,
  hasEntries,
}: FulfillmentArgs): FulfillmentStatus {
  if (!hasEntries || sollKcal == null || sollKcal <= 0) return 'OPEN'

  if (isDeficitDay) {
    return istKcal <= sollKcal * (1 + KCAL_TOLERANCE) ? 'FULFILLED' : 'NOT_FULFILLED'
  }
  // Band-Logik für Erhalt / Überschuss / Refeed
  const lo = sollKcal * (1 - KCAL_TOLERANCE)
  const hi = sollKcal * (1 + KCAL_TOLERANCE)
  return istKcal >= lo && istKcal <= hi ? 'FULFILLED' : 'NOT_FULFILLED'
}
