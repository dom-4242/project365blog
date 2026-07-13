import { describe, it, expect } from 'vitest'
import { computeTrend } from './coach'

describe('computeTrend', () => {
  it('returns flat with null delta when there is no previous value', () => {
    const r = computeTrend(42, null)
    expect(r).toEqual({ current: 42, previous: null, delta: null, trend: 'flat' })
  })

  it('detects an upward trend above the epsilon threshold', () => {
    const r = computeTrend(40.5, 39.0)
    expect(r.delta).toBe(1.5)
    expect(r.trend).toBe('up')
  })

  it('detects a downward trend below the epsilon threshold', () => {
    const r = computeTrend(38.2, 40.0)
    expect(r.delta).toBe(-1.8)
    expect(r.trend).toBe('down')
  })

  it('treats sub-epsilon changes as flat', () => {
    const r = computeTrend(40.02, 40.0)
    expect(r.trend).toBe('flat')
  })

  it('rounds the delta to one decimal place', () => {
    const r = computeTrend(40.06, 40.0)
    expect(r.delta).toBe(0.1)
    expect(r.trend).toBe('up')
  })

  it('respects a custom epsilon', () => {
    expect(computeTrend(40.3, 40.0, 0.5).trend).toBe('flat')
    expect(computeTrend(40.7, 40.0, 0.5).trend).toBe('up')
  })
})
