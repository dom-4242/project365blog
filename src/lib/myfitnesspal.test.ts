import { describe, it, expect, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { parseMfpNutritionCsv, importNutritionCsv, type NutritionRow } from './myfitnesspal'

// =============================================
// parseMfpNutritionCsv
// =============================================

const CSV = `Date,Meal,Calories,"Fat (g)","Saturated Fat","Cholesterol","Sodium (mg)","Carbohydrates (g)",Fiber,Sugar,"Protein (g)","Vitamin C",Iron,Zinc,Note
2026-07-01,Breakfast,450,20,5,100,300,40,6,10,25,15,8,3,"Oats and eggs"
2026-07-01,Lunch,700,30,8,120,600,60,8,12,40,20,10,4,
2026-07-02,Breakfast,400,,,,,,,,30,,,,
,Snacks,100,1,0,0,10,20,1,5,2,0,0,0,`

describe('parseMfpNutritionCsv', () => {
  it('maps macros to columns and everything else into micros', () => {
    const rows = parseMfpNutritionCsv(CSV)
    // the row with an empty date is skipped
    expect(rows).toHaveLength(3)

    const bf = rows.find((r) => r.date === '2026-07-01' && r.meal === 'Breakfast')!
    expect(bf.calories).toBe(450)
    expect(bf.fat).toBe(20)
    expect(bf.carbs).toBe(40)
    expect(bf.fiber).toBe(6)
    expect(bf.sugar).toBe(10)
    expect(bf.sodium).toBe(300)
    expect(bf.protein).toBe(25)
    expect(bf.note).toBe('Oats and eggs')

    // micros: known + unknown columns
    expect(bf.micros.satFat).toBe(5)
    expect(bf.micros.cholesterol).toBe(100)
    expect(bf.micros.vitaminC).toBe(15)
    expect(bf.micros.iron).toBe(8)
    expect(bf.micros.zinc).toBe(3) // unknown column captured generically
  })

  it('leaves missing values null and micros empty', () => {
    const rows = parseMfpNutritionCsv(CSV)
    const row = rows.find((r) => r.date === '2026-07-02')!
    expect(row.calories).toBe(400)
    expect(row.protein).toBe(30)
    expect(row.fat).toBeNull()
    expect(row.sodium).toBeNull()
    expect(Object.keys(row.micros)).toHaveLength(0)
    expect(row.note).toBeNull()
  })

  it('skips rows without a date or meal', () => {
    const rows = parseMfpNutritionCsv(CSV)
    expect(rows.some((r) => r.meal === 'Snacks')).toBe(false)
  })
})

// =============================================
// importNutritionCsv
// =============================================

describe('importNutritionCsv', () => {
  function makePrismaMock() {
    const upsert = vi.fn().mockResolvedValue({})
    const prisma = { nutritionLog: { upsert } } as unknown as PrismaClient
    return { prisma, upsert }
  }

  const base = (over: Partial<NutritionRow>): NutritionRow => ({
    date: '2026-07-01', meal: 'Breakfast',
    calories: null, protein: null, carbs: null, fat: null, fiber: null, sugar: null, sodium: null,
    micros: {}, note: null, ...over,
  })

  it('aggregates duplicate (date, meal) rows and upserts one record each', async () => {
    const rows: NutritionRow[] = [
      base({ date: '2026-07-01', meal: 'Breakfast', calories: 450, protein: 25, micros: { satFat: 5 }, note: 'x' }),
      base({ date: '2026-07-01', meal: 'Breakfast', calories: 50, protein: 5, micros: { satFat: 1 }, note: 'y' }),
      base({ date: '2026-07-01', meal: 'Lunch', calories: 700 }),
      base({ date: '2026-07-02', meal: 'Breakfast', calories: 400 }),
    ]

    const { prisma, upsert } = makePrismaMock()
    const summary = await importNutritionCsv(rows, prisma)

    // 3 unique (date, meal) keys
    expect(upsert).toHaveBeenCalledTimes(3)
    expect(summary.entries).toBe(3)
    expect(summary.days).toBe(2)
    expect(summary.from).toBe('2026-07-01')
    expect(summary.to).toBe('2026-07-02')

    // aggregated breakfast for 2026-07-01
    const bfCall = upsert.mock.calls
      .map((c) => c[0])
      .find((a) => a.create.meal === 'Breakfast' && a.create.date.toISOString().slice(0, 10) === '2026-07-01')!
    expect(bfCall.create.calories).toBe(500)   // 450 + 50
    expect(bfCall.create.protein).toBe(30)     // 25 + 5
    expect(bfCall.create.micros.satFat).toBe(6) // 5 + 1
    expect(bfCall.create.note).toBe('x | y')
    expect(bfCall.create.source).toBe('MYFITNESSPAL')
    expect(bfCall.where.date_meal_source.source).toBe('MYFITNESSPAL')
  })
})
