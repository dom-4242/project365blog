import { describe, it, expect } from 'vitest'
import { pickTargetsForDate } from './targets'

const mk = (validFrom: string, id: string) => ({ id, validFrom: new Date(validFrom) })

describe('pickTargetsForDate — Versionsauflösung (letztes validFrom ≤ Datum)', () => {
  const versions = [
    mk('2026-07-08', 'a'),
    mk('2026-08-01', 'b'),
    mk('2026-09-15', 'c'),
  ]

  it('wählt die jüngste Version, die am/vor dem Datum gilt', () => {
    expect(pickTargetsForDate(versions, new Date('2026-08-20'))!.id).toBe('b')
  })

  it('exakt am validFrom-Tag greift diese Version', () => {
    expect(pickTargetsForDate(versions, new Date('2026-09-15'))!.id).toBe('c')
  })

  it('vor der ersten Version → null', () => {
    expect(pickTargetsForDate(versions, new Date('2026-07-01'))).toBeNull()
  })

  it('nach der letzten Version → jüngste Version', () => {
    expect(pickTargetsForDate(versions, new Date('2027-01-01'))!.id).toBe('c')
  })

  it('Zeitanteil des Datums wird ignoriert (nur Kalendertag zählt)', () => {
    expect(pickTargetsForDate(versions, new Date('2026-08-01T23:59:59Z'))!.id).toBe('b')
  })

  it('leere Liste → null', () => {
    expect(pickTargetsForDate([], new Date('2026-08-01'))).toBeNull()
  })
})
