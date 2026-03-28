import { describe, it, expect } from 'vitest'
import { getExcerpt, getDayNumber } from './journal'

// =============================================
// getExcerpt
// =============================================

describe('getExcerpt', () => {
  it('returns the first plain-text paragraph', () => {
    const content = '\n\nDies ist der erste Absatz.\n\n## Überschrift\n\nZweiter Absatz.'
    expect(getExcerpt(content)).toBe('Dies ist der erste Absatz.')
  })

  it('skips headings', () => {
    const content = '## Überschrift\n\nErster echter Absatz.'
    expect(getExcerpt(content)).toBe('Erster echter Absatz.')
  })

  it('truncates at maxLength and appends ellipsis', () => {
    const long = 'a'.repeat(200)
    const result = getExcerpt(long, 50)
    expect(result).toHaveLength(51) // 50 chars + …
    expect(result.endsWith('…')).toBe(true)
  })

  it('strips bold markdown', () => {
    expect(getExcerpt('**Fett** und normal.')).toBe('Fett und normal.')
  })

  it('strips inline code', () => {
    expect(getExcerpt('Ein `code` Wort.')).toBe('Ein code Wort.')
  })

  it('strips links', () => {
    expect(getExcerpt('Schau mal [hier](https://example.com).')).toBe('Schau mal hier.')
  })

  it('returns empty string for empty content', () => {
    expect(getExcerpt('')).toBe('')
  })

  it('skips short lines', () => {
    const content = 'kurz\n\nDieser Satz ist lang genug um als Excerpt zu gelten.'
    expect(getExcerpt(content)).toBe('Dieser Satz ist lang genug um als Excerpt zu gelten.')
  })
})

// =============================================
// getDayNumber
// =============================================

describe('getDayNumber', () => {
  it('returns 1 for project start date', () => {
    expect(getDayNumber('2026-03-26')).toBe(1)
  })

  it('returns 2 for day after start', () => {
    expect(getDayNumber('2026-03-27')).toBe(2)
  })

  it('returns 365 for last day of project (2027-03-25)', () => {
    expect(getDayNumber('2027-03-25')).toBe(365)
  })

  it('returns correct number for arbitrary date', () => {
    expect(getDayNumber('2026-04-01')).toBe(7)
  })
})
