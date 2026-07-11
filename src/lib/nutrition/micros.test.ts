import { describe, it, expect } from 'vitest'
import { aggregateMicros, microCoverage, MICRO_META } from './micros'

describe('aggregateMicros', () => {
  it('sums present values null-aware', () => {
    const totals = aggregateMicros([
      { fiberG: 3, sodiumMg: 100, vitaminCMg: null },
      { fiberG: 2, sodiumMg: null, vitaminCMg: 12 },
    ])
    expect(totals.fiberG).toBe(5)
    // one entry null, one 100 -> present entry counts, missing counts as 0
    expect(totals.sodiumMg).toBe(100)
    expect(totals.vitaminCMg).toBe(12)
  })

  it('keeps null when no entry provides the value', () => {
    const totals = aggregateMicros([{ fiberG: 3 }, { fiberG: 2 }])
    expect(totals.fiberG).toBe(5)
    expect(totals.ironMg).toBeNull()
    expect(totals.vitaminDUg).toBeNull()
  })

  it('rounds to 2 decimals', () => {
    const totals = aggregateMicros([{ ironMg: 0.111 }, { ironMg: 0.222 }])
    expect(totals.ironMg).toBe(0.33)
  })

  it('returns all-null for empty input', () => {
    const totals = aggregateMicros([])
    for (const m of MICRO_META) expect(totals[m.key]).toBeNull()
  })
})

describe('microCoverage', () => {
  it('counts present micros out of 12', () => {
    const totals = aggregateMicros([{ fiberG: 1, sodiumMg: 2, ironMg: 3 }])
    expect(microCoverage(totals)).toEqual({ present: 3, total: 12 })
  })
})
