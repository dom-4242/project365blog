import { describe, it, expect } from 'vitest'
import { kcalTone, proteinTone, budgetTone } from './traffic-light'

describe('kcalTone', () => {
  it('deficit: under target is good, within +5% is warn, over is bad', () => {
    expect(kcalTone(1800, 2000, true)).toBe('good')
    expect(kcalTone(2000, 2000, true)).toBe('good')
    expect(kcalTone(2080, 2000, true)).toBe('warn') // +4%
    expect(kcalTone(2200, 2000, true)).toBe('bad') // +10%
  })

  it('non-deficit: symmetric band around target', () => {
    expect(kcalTone(2000, 2000, false)).toBe('good')
    expect(kcalTone(1850, 2000, false)).toBe('warn') // -7.5%
    expect(kcalTone(1700, 2000, false)).toBe('bad') // -15%
    expect(kcalTone(2150, 2000, false)).toBe('warn') // +7.5%
  })

  it('no target -> warn', () => {
    expect(kcalTone(1000, 0, true)).toBe('warn')
  })
})

describe('proteinTone', () => {
  it('hitting or exceeding the target is good', () => {
    expect(proteinTone(185, 185)).toBe('good')
    expect(proteinTone(220, 185)).toBe('good') // over is fine
    expect(proteinTone(170, 185)).toBe('good') // 92%
  })
  it('moderately under is warn, far under is bad', () => {
    expect(proteinTone(140, 185)).toBe('warn') // 76%
    expect(proteinTone(90, 185)).toBe('bad') // 49%
  })
})

describe('budgetTone', () => {
  it('deficit: under or near budget is good, moderately over warn, far over bad', () => {
    expect(budgetTone(200, 275, true)).toBe('good')
    expect(budgetTone(280, 275, true)).toBe('good') // +2%
    expect(budgetTone(310, 275, true)).toBe('warn') // +13%
    expect(budgetTone(360, 275, true)).toBe('bad') // +31%
  })
  it('non-deficit: symmetric band', () => {
    expect(budgetTone(275, 275, false)).toBe('good')
    expect(budgetTone(240, 275, false)).toBe('warn') // -13%
    expect(budgetTone(180, 275, false)).toBe('bad') // -35%
  })
})
