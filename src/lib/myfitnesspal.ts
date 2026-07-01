import Papa from 'papaparse'
import type { PrismaClient, Prisma } from '@prisma/client'

// =============================================
// MyFitnessPal CSV import (Nutrition-Summary.csv)
//
// The MFP data export delivers nutrition rolled up per meal per day. This
// parser is deliberately tolerant: known macros land in typed columns, every
// other nutrient column is captured in a `micros` map so nothing is lost, even
// if MFP adds/renames columns.
// =============================================

// Canonical macro keys that get their own DailyMetrics-style columns.
const MACRO_KEYS = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium'] as const
type MacroKey = (typeof MACRO_KEYS)[number]

export interface NutritionRow {
  date: string // YYYY-MM-DD
  meal: string
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  fiber: number | null
  sugar: number | null
  sodium: number | null
  micros: Record<string, number>
  note: string | null
}

// Normalized CSV header → canonical key. Headers are normalized first
// (lowercased, units in parentheses stripped, whitespace collapsed).
const HEADER_MAP: Record<string, string> = {
  'date': 'date',
  'meal': 'meal',
  'note': 'note',
  'notes': 'note',
  // macros (typed columns)
  'calories': 'calories',
  'protein': 'protein',
  'carbohydrates': 'carbs',
  'carbs': 'carbs',
  'fat': 'fat',
  'fiber': 'fiber',
  'sugar': 'sugar',
  'sodium': 'sodium',
  // micros (go into the JSON map)
  'saturated fat': 'satFat',
  'polyunsaturated fat': 'polyFat',
  'monounsaturated fat': 'monoFat',
  'trans fat': 'transFat',
  'cholesterol': 'cholesterol',
  'potassium': 'potassium',
  'vitamin a': 'vitaminA',
  'vitamin c': 'vitaminC',
  'calcium': 'calcium',
  'iron': 'iron',
}

/** Nutrient metadata for display (macros + known micros). */
export const NUTRIENT_META: Record<string, { label: string; unit: string }> = {
  calories:    { label: 'Kalorien',              unit: 'kcal' },
  protein:     { label: 'Protein',               unit: 'g' },
  carbs:       { label: 'Kohlenhydrate',         unit: 'g' },
  fat:         { label: 'Fett',                  unit: 'g' },
  fiber:       { label: 'Ballaststoffe',         unit: 'g' },
  sugar:       { label: 'Zucker',                unit: 'g' },
  sodium:      { label: 'Natrium',               unit: 'mg' },
  satFat:      { label: 'Gesättigte Fettsäuren', unit: 'g' },
  polyFat:     { label: 'Mehrfach ungesättigte Fettsäuren', unit: 'g' },
  monoFat:     { label: 'Einfach ungesättigte Fettsäuren',  unit: 'g' },
  transFat:    { label: 'Transfette',            unit: 'g' },
  cholesterol: { label: 'Cholesterin',           unit: 'mg' },
  potassium:   { label: 'Kalium',                unit: 'mg' },
  vitaminA:    { label: 'Vitamin A',             unit: '' },
  vitaminC:    { label: 'Vitamin C',             unit: '' },
  calcium:     { label: 'Calcium',               unit: '' },
  iron:        { label: 'Eisen',                 unit: '' },
}

export function nutrientLabel(key: string): string {
  return NUTRIENT_META[key]?.label ?? key
}

// Normalize a raw CSV header: lowercase, drop "(unit)", collapse whitespace.
function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()
}

// Parse a numeric cell; tolerates thousands separators and empty values.
function parseNumber(raw: string | undefined): number | null {
  if (raw == null) return null
  const cleaned = raw.replace(/,/g, '').trim()
  if (cleaned === '') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

// Parse an MFP date cell into YYYY-MM-DD (export uses ISO; fall back defensively).
function parseDate(raw: string | undefined): string | null {
  if (!raw) return null
  const s = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const d = new Date(s)
  if (isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

const MACRO_SET = new Set<string>(MACRO_KEYS)

/**
 * Parses an MFP Nutrition-Summary CSV into per-row nutrition records.
 * Rows without a valid date or meal are skipped.
 */
export function parseMfpNutritionCsv(text: string): NutritionRow[] {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  })

  const rows: NutritionRow[] = []

  for (const raw of parsed.data) {
    // Remap the raw row's headers to canonical keys.
    const canon: Record<string, string> = {}
    for (const [header, value] of Object.entries(raw)) {
      const norm = normalizeHeader(header)
      const key = HEADER_MAP[norm] ?? norm // unknown nutrient columns keep their normalized name
      canon[key] = value
    }

    const date = parseDate(canon['date'])
    const meal = (canon['meal'] ?? '').trim()
    if (!date || !meal) continue

    const macros = {} as Record<MacroKey, number | null>
    for (const k of MACRO_KEYS) macros[k] = parseNumber(canon[k])

    // Everything nutrient-like that isn't a macro/meta column → micros.
    const micros: Record<string, number> = {}
    for (const [key, value] of Object.entries(canon)) {
      if (key === 'date' || key === 'meal' || key === 'note' || MACRO_SET.has(key)) continue
      const n = parseNumber(value)
      if (n !== null) micros[key] = n
    }

    const note = (canon['note'] ?? '').trim() || null

    rows.push({ date, meal, ...macros, micros, note })
  }

  return rows
}

export interface ImportSummary {
  entries: number      // number of (date, meal) records upserted
  days: number         // distinct days covered
  from: string | null  // earliest date
  to: string | null    // latest date
}

// Sum two nullable numbers, treating null as "no contribution" but keeping null
// if neither side has a value.
function addNullable(a: number | null, b: number | null): number | null {
  if (a == null) return b
  if (b == null) return a
  return a + b
}

/**
 * Aggregates parsed rows by (date, meal) — robust to both meal-rolled-up and
 * per-food exports — and upserts them into NutritionLog (idempotent).
 */
export async function importNutritionCsv(
  rows: NutritionRow[],
  prisma: PrismaClient,
): Promise<ImportSummary> {
  // Aggregate duplicates within the file by (date, meal).
  const byKey = new Map<string, NutritionRow>()
  for (const row of rows) {
    const key = `${row.date}|${row.meal}`
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, { ...row, micros: { ...row.micros } })
      continue
    }
    for (const k of MACRO_KEYS) existing[k] = addNullable(existing[k], row[k])
    for (const [mk, mv] of Object.entries(row.micros)) {
      existing.micros[mk] = (existing.micros[mk] ?? 0) + mv
    }
    if (row.note) existing.note = existing.note ? `${existing.note} | ${row.note}` : row.note
  }

  const dates = new Set<string>()
  for (const entry of byKey.values()) {
    dates.add(entry.date)
    const data = {
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      fiber: entry.fiber,
      sugar: entry.sugar,
      sodium: entry.sodium,
      micros: entry.micros as Prisma.InputJsonValue,
      note: entry.note,
    }
    await prisma.nutritionLog.upsert({
      where: { date_meal_source: { date: new Date(entry.date), meal: entry.meal, source: 'MYFITNESSPAL' } },
      update: data,
      create: { date: new Date(entry.date), meal: entry.meal, source: 'MYFITNESSPAL', ...data },
    })
  }

  const sortedDates = [...dates].sort()
  return {
    entries: byKey.size,
    days: dates.size,
    from: sortedDates[0] ?? null,
    to: sortedDates[sortedDates.length - 1] ?? null,
  }
}
