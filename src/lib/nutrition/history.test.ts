import { describe, it, expect } from 'vitest'
import { trailingWeightAverage, computeCalibration } from './history'

describe('trailingWeightAverage', () => {
  it('averages available weights in the trailing window', () => {
    const series = [
      { date: '2026-07-01', weight: 90 },
      { date: '2026-07-02', weight: 91 },
      { date: '2026-07-03', weight: 92 },
    ]
    const avg = trailingWeightAverage(series, 3)
    expect(avg[0]).toBe(90)
    expect(avg[1]).toBe(90.5)
    expect(avg[2]).toBe(91)
  })

  it('skips null days but keeps window length', () => {
    const series = [
      { date: '2026-07-01', weight: 90 },
      { date: '2026-07-02', weight: null },
      { date: '2026-07-03', weight: 92 },
    ]
    const avg = trailingWeightAverage(series, 3)
    expect(avg[2]).toBe(91) // (90 + 92) / 2
  })

  it('is null while no measurement is in the window', () => {
    const series = [
      { date: '2026-07-01', weight: null },
      { date: '2026-07-02', weight: null },
    ]
    expect(trailingWeightAverage(series, 7)).toEqual([null, null])
  })
})

describe('computeCalibration', () => {
  function ramp(start: number, step: number, n = 14) {
    return Array.from({ length: n }, (_, i) => ({ weight: start + step * i }))
  }

  it('detects a deficit when week-2 avg is clearly lower', () => {
    const c = computeCalibration(ramp(94, -0.1)) // steady loss
    expect(c.tendency).toBe('deficit')
    expect(c.deltaKg).toBeLessThan(0)
    expect(c.daysWithWeight).toBe(14)
  })

  it('detects a surplus when week-2 avg is clearly higher', () => {
    const c = computeCalibration(ramp(90, 0.1))
    expect(c.tendency).toBe('surplus')
    expect(c.deltaKg).toBeGreaterThan(0)
  })

  it('detects maintenance inside the band', () => {
    const c = computeCalibration(ramp(90, 0)) // flat
    expect(c.tendency).toBe('maintenance')
    expect(c.deltaKg).toBe(0)
  })

  it('reports insufficient data when a half has no weight', () => {
    const series = [
      { weight: 90 },
      { weight: 90 },
      { weight: null },
      { weight: null },
    ]
    // second half all null
    const c = computeCalibration([...series, { weight: null }, { weight: null }])
    expect(c.tendency).toBe('insufficient_data')
  })
})
