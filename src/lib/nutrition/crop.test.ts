import { describe, it, expect } from 'vitest'
import { computeCropRect } from './crop'

const dims = { naturalWidth: 2000, naturalHeight: 1000, displayWidth: 400, displayHeight: 200 }

describe('computeCropRect', () => {
  it('scales the displayed selection up to native resolution', () => {
    // scale = 5x
    const r = computeCropRect({ x: 40, y: 20, width: 100, height: 50 }, dims)
    expect(r).toEqual({ sx: 200, sy: 100, sw: 500, sh: 250, outW: 500, outH: 250 })
  })

  it('clamps the rect to the image bounds', () => {
    const r = computeCropRect({ x: 380, y: 190, width: 100, height: 100 }, dims)
    // sx=1900, sy=950 -> width limited to 100, height to 50
    expect(r.sx).toBe(1900)
    expect(r.sy).toBe(950)
    expect(r.sw).toBe(100)
    expect(r.sh).toBe(50)
  })

  it('never returns a zero-size rect', () => {
    const r = computeCropRect({ x: 0, y: 0, width: 0, height: 0 }, dims)
    expect(r.sw).toBeGreaterThanOrEqual(1)
    expect(r.sh).toBeGreaterThanOrEqual(1)
  })

  it('handles missing display dims without dividing by zero', () => {
    const r = computeCropRect(
      { x: 10, y: 10, width: 20, height: 20 },
      { naturalWidth: 100, naturalHeight: 100, displayWidth: 0, displayHeight: 0 },
    )
    expect(Number.isFinite(r.sx)).toBe(true)
    expect(r.sw).toBeGreaterThanOrEqual(1)
  })
})
