import { describe, it, expect } from 'vitest'
import { computeKcalChartModel, type KcalWeekDay } from './public-week'

function day(date: string, ist: number | null, fulfilled: boolean | null = null): KcalWeekDay {
  return { date, ist, fulfilled, isRefeed: false }
}

describe('computeKcalChartModel', () => {
  const days = [
    day('2026-07-01', 1900, true),
    day('2026-07-02', 2200, false),
    day('2026-07-03', null),
  ]

  it('scales bar heights against a headroom max above the peak', () => {
    const m = computeKcalChartModel(days, 2000, 'DEFICIT')
    // peak = max(2000 soll, 2200 ist) = 2200 -> max = 2530
    expect(m.max).toBeCloseTo(2530, 0)
    expect(m.bars[0].heightPct).toBeCloseTo((1900 / 2530) * 100, 1)
    expect(m.bars[1].heightPct).toBeCloseTo((2200 / 2530) * 100, 1)
  })

  it('marks missing days as zero-height without value', () => {
    const m = computeKcalChartModel(days, 2000, 'DEFICIT')
    expect(m.bars[2].hasValue).toBe(false)
    expect(m.bars[2].heightPct).toBe(0)
  })

  it('deficit zone spans from the SOLL line down to the bottom', () => {
    const m = computeKcalChartModel(days, 2000, 'DEFICIT')
    expect(m.sollTopPct).not.toBeNull()
    expect(m.zone).toEqual({ topPct: m.sollTopPct!, heightPct: 100 - m.sollTopPct! })
  })

  it('surplus zone spans from the top down to the SOLL line', () => {
    const m = computeKcalChartModel(days, 2000, 'SURPLUS')
    expect(m.zone).toEqual({ topPct: 0, heightPct: m.sollTopPct! })
  })

  it('maintenance zone is a band around the SOLL line', () => {
    const m = computeKcalChartModel(days, 2000, 'MAINTENANCE')
    expect(m.zone).not.toBeNull()
    // Band muss die SOLL-Linie enthalten
    expect(m.zone!.topPct).toBeLessThanOrEqual(m.sollTopPct!)
    expect(m.zone!.topPct + m.zone!.heightPct).toBeGreaterThanOrEqual(m.sollTopPct!)
  })

  it('returns no line/zone without a SOLL', () => {
    const m = computeKcalChartModel(days, null, 'DEFICIT')
    expect(m.sollTopPct).toBeNull()
    expect(m.zone).toBeNull()
  })
})
