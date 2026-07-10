import { describe, it, expect } from 'vitest'
import {
  evaluateFulfillment,
  isoWeekday,
  matchesRecurringRefeed,
  effectiveIsRefeed,
} from './fulfillment'

describe('isoWeekday', () => {
  it('Montag = 1, Sonntag = 7', () => {
    expect(isoWeekday(new Date('2026-07-06'))).toBe(1) // Mo
    expect(isoWeekday(new Date('2026-07-08'))).toBe(3) // Mi
    expect(isoWeekday(new Date('2026-07-12'))).toBe(7) // So
  })
})

describe('Refeed-Erkennung', () => {
  const rules = [{ active: true, recurringWeekdays: [3, 7] }] // Mi + So
  it('matcht wiederkehrende Wochentage', () => {
    expect(matchesRecurringRefeed(3, rules)).toBe(true)
    expect(matchesRecurringRefeed(7, rules)).toBe(true)
    expect(matchesRecurringRefeed(1, rules)).toBe(false)
  })
  it('inaktive Regeln zählen nicht', () => {
    expect(matchesRecurringRefeed(3, [{ active: false, recurringWeekdays: [3] }])).toBe(false)
  })
  it('ad-hoc-Markierung erzwingt Refeed', () => {
    expect(effectiveIsRefeed(true, 1, rules)).toBe(true) // Mo, aber ad-hoc
    expect(effectiveIsRefeed(false, 3, rules)).toBe(true) // Mi über Regel
    expect(effectiveIsRefeed(false, 1, rules)).toBe(false)
  })
})

describe('evaluateFulfillment — Defizit-Tag (IST ≤ SOLL × 1,05)', () => {
  const base = { sollKcal: 2301, isDeficitDay: true, hasEntries: true }
  it('unter SOLL → erfüllt', () => {
    expect(evaluateFulfillment({ ...base, istKcal: 2000 })).toBe('FULFILLED')
  })
  it('exakt an der +5%-Grenze → erfüllt', () => {
    expect(evaluateFulfillment({ ...base, istKcal: Math.round(2301 * 1.05) })).toBe('FULFILLED')
  })
  it('deutlich über SOLL → nicht erfüllt', () => {
    expect(evaluateFulfillment({ ...base, istKcal: 2600 })).toBe('NOT_FULFILLED')
  })
})

describe('evaluateFulfillment — Band-Tag (Erhalt/Refeed, SOLL ±5%)', () => {
  const base = { sollKcal: 2877, isDeficitDay: false, hasEntries: true }
  it('im Band → erfüllt', () => {
    expect(evaluateFulfillment({ ...base, istKcal: 2877 })).toBe('FULFILLED')
    expect(evaluateFulfillment({ ...base, istKcal: 2750 })).toBe('FULFILLED')
  })
  it('unter dem Band → nicht erfüllt (anders als Defizit!)', () => {
    expect(evaluateFulfillment({ ...base, istKcal: 2000 })).toBe('NOT_FULFILLED')
  })
  it('über dem Band → nicht erfüllt', () => {
    expect(evaluateFulfillment({ ...base, istKcal: 3200 })).toBe('NOT_FULFILLED')
  })
})

describe('evaluateFulfillment — OFFEN', () => {
  it('keine Einträge → OFFEN', () => {
    expect(evaluateFulfillment({ istKcal: 0, sollKcal: 2301, isDeficitDay: true, hasEntries: false })).toBe('OPEN')
  })
  it('keine gültigen Eckdaten (SOLL null) → OFFEN', () => {
    expect(evaluateFulfillment({ istKcal: 1500, sollKcal: null, isDeficitDay: true, hasEntries: true })).toBe('OPEN')
  })
})
