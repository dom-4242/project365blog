import { describe, it, expect } from 'vitest'
import { MetricSource } from '@prisma/client'
import { parseHealthPayload, mergeWithExisting, type HealthPayload } from './apple-health'

// =============================================
// Fixtures
// =============================================

function makePayload(metrics: HealthPayload['data']['metrics']): HealthPayload {
  return { data: { metrics } }
}

const STEP_METRIC = {
  name: 'Step Count',
  units: 'count',
  data: [
    { qty: 4200, date: '2026-03-28 08:00:00 +0100' },
    { qty: 6100, date: '2026-03-28 18:00:00 +0100' },
    { qty: 9800, date: '2026-03-27 20:00:00 +0100' },
  ],
}

const HR_METRIC = {
  name: 'Resting Heart Rate',
  units: 'bpm',
  data: [
    { qty: 58, date: '2026-03-28 07:00:00 +0100' },
    { qty: 62, date: '2026-03-28 23:00:00 +0100' },
  ],
}

const SLEEP_METRIC_HOURS = {
  name: 'Sleep Analysis',
  units: 'hr',
  data: [{ asleep: 7.5, date: '2026-03-28 06:30:00 +0100' }],
}

const SLEEP_METRIC_MINUTES = {
  name: 'Sleep Analysis',
  units: 'min',
  data: [{ qty: 420, date: '2026-03-28 06:30:00 +0100' }],
}

const ACTIVE_ENERGY_METRIC = {
  name: 'Active Energy',
  units: 'kcal',
  data: [
    { qty: 450, date: '2026-03-28 12:00:00 +0100' },
    { qty: 350, date: '2026-03-28 20:00:00 +0100' },
  ],
}

const BASAL_ENERGY_METRIC = {
  name: 'Basal Energy Burned',
  units: 'kcal',
  data: [{ qty: 1800, date: '2026-03-28 00:00:00 +0100' }],
}

const DISTANCE_METRIC_KM = {
  name: 'Walking + Running Distance',
  units: 'km',
  data: [{ qty: 7.42, date: '2026-03-28 20:00:00 +0100' }],
}

const DISTANCE_METRIC_MI = {
  name: 'Walking + Running Distance',
  units: 'mi',
  data: [{ qty: 4.61, date: '2026-03-28 20:00:00 +0100' }],
}

const WEIGHT_METRIC = {
  name: 'Body Mass',
  units: 'kg',
  data: [{ qty: 94.5, date: '2026-03-28 08:00:00 +0100' }],
}

// =============================================
// parseHealthPayload
// =============================================

describe('parseHealthPayload', () => {
  it('returns empty map for empty metrics array', () => {
    const result = parseHealthPayload(makePayload([]))
    expect(result.size).toBe(0)
  })

  it('sums steps across multiple entries on the same day', () => {
    const result = parseHealthPayload(makePayload([STEP_METRIC]))
    expect(result.get('2026-03-28')?.steps).toBe(10300) // 4200 + 6100
    expect(result.get('2026-03-27')?.steps).toBe(9800)
  })

  it('averages resting heart rate entries on the same day', () => {
    const result = parseHealthPayload(makePayload([HR_METRIC]))
    expect(result.get('2026-03-28')?.restingHR).toBe(60) // avg(58, 62)
  })

  it('converts sleep hours to minutes', () => {
    const result = parseHealthPayload(makePayload([SLEEP_METRIC_HOURS]))
    expect(result.get('2026-03-28')?.sleepDuration).toBe(450) // 7.5 * 60
  })

  it('uses sleep qty directly when units are minutes', () => {
    const result = parseHealthPayload(makePayload([SLEEP_METRIC_MINUTES]))
    expect(result.get('2026-03-28')?.sleepDuration).toBe(420)
  })

  it('sums active + basal energy for total calories', () => {
    const result = parseHealthPayload(makePayload([ACTIVE_ENERGY_METRIC, BASAL_ENERGY_METRIC]))
    expect(result.get('2026-03-28')?.caloriesBurned).toBe(2600) // 450+350+1800
  })

  it('uses active energy alone when no basal metric present', () => {
    const result = parseHealthPayload(makePayload([ACTIVE_ENERGY_METRIC]))
    expect(result.get('2026-03-28')?.caloriesBurned).toBe(800) // 450+350
  })

  it('keeps km distance as-is', () => {
    const result = parseHealthPayload(makePayload([DISTANCE_METRIC_KM]))
    expect(result.get('2026-03-28')?.distance).toBe(7.42)
  })

  it('converts miles to km', () => {
    const result = parseHealthPayload(makePayload([DISTANCE_METRIC_MI]))
    // 4.61 mi * 1.60934 = 7.419
    expect(result.get('2026-03-28')?.distance).toBe(7.42)
  })

  it('parses weight from Body Mass metric', () => {
    const result = parseHealthPayload(makePayload([WEIGHT_METRIC]))
    expect(result.get('2026-03-28')?.weight).toBe(94.5)
  })

  it('handles multiple metrics and multiple days', () => {
    const result = parseHealthPayload(makePayload([STEP_METRIC, HR_METRIC, SLEEP_METRIC_HOURS]))
    const mar28 = result.get('2026-03-28')
    expect(mar28?.steps).toBe(10300)
    expect(mar28?.restingHR).toBe(60)
    expect(mar28?.sleepDuration).toBe(450)
    expect(result.get('2026-03-27')?.steps).toBe(9800)
  })

  it('handles missing data array gracefully', () => {
    const payload: HealthPayload = { data: {} }
    const result = parseHealthPayload(payload)
    expect(result.size).toBe(0)
  })
})

// =============================================
// mergeWithExisting
// =============================================

describe('mergeWithExisting', () => {
  const fitbitRecord = {
    weight: 95.9,
    bodyFat: 34.4,
    bmi: 33.1,
    steps: 8500,
    caloriesBurned: 2200,
    distance: 6.1,
    restingHR: 65,
    sleepDuration: null,
    source: MetricSource.FITBIT,
  }

  it('sets source to MERGED when existing is FITBIT', () => {
    const result = mergeWithExisting(fitbitRecord, { steps: 9000 })
    expect(result.source).toBe(MetricSource.MERGED)
  })

  it('keeps source as APPLE_HEALTH when existing is APPLE_HEALTH', () => {
    const existing = { ...fitbitRecord, source: MetricSource.APPLE_HEALTH }
    const result = mergeWithExisting(existing, { restingHR: 58 })
    expect(result.source).toBe(MetricSource.APPLE_HEALTH)
  })

  it('keeps Fitbit weight when Apple Health provides weight', () => {
    const result = mergeWithExisting(fitbitRecord, { weight: 94.0 })
    expect(result.weight).toBe(95.9)
  })

  it('uses Apple weight when no Fitbit weight exists', () => {
    const noWeight = { ...fitbitRecord, weight: null, source: MetricSource.APPLE_HEALTH }
    const result = mergeWithExisting(noWeight, { weight: 94.0 })
    expect(result.weight).toBe(94.0)
  })

  it('Apple Health steps win over Fitbit steps', () => {
    const result = mergeWithExisting(fitbitRecord, { steps: 11000 })
    expect(result.steps).toBe(11000)
  })

  it('Apple Health steps win even when lower than Fitbit steps', () => {
    const result = mergeWithExisting(fitbitRecord, { steps: 3000 })
    expect(result.steps).toBe(3000)
  })

  it('Apple Watch restingHR overwrites Fitbit restingHR', () => {
    const result = mergeWithExisting(fitbitRecord, { restingHR: 55 })
    expect(result.restingHR).toBe(55)
  })

  it('fills sleepDuration from Apple when Fitbit has none', () => {
    const result = mergeWithExisting(fitbitRecord, { sleepDuration: 420 })
    expect(result.sleepDuration).toBe(420)
  })

  it('does not overwrite existing calories with Apple data', () => {
    const result = mergeWithExisting(fitbitRecord, { caloriesBurned: 2600 })
    expect(result.caloriesBurned).toBe(2200) // Fitbit value preserved
  })

  it('fills calories from Apple when Fitbit has none', () => {
    const noCal = { ...fitbitRecord, caloriesBurned: null }
    const result = mergeWithExisting(noCal, { caloriesBurned: 2600 })
    expect(result.caloriesBurned).toBe(2600)
  })

  it('preserves bmi from Fitbit scale regardless', () => {
    const result = mergeWithExisting(fitbitRecord, { weight: 94.0 })
    expect(result.bmi).toBe(33.1)
  })
})
