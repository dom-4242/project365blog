'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { parseMfpNutritionCsv, importNutritionCsv, type ImportSummary } from '@/lib/myfitnesspal'

export interface ImportResult {
  error?: string
  summary?: ImportSummary
}

export async function importNutrition(formData: FormData): Promise<ImportResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Keine Datei ausgewählt' }
  }
  // Guard against accidental huge uploads (CSV export is small).
  if (file.size > 20 * 1024 * 1024) {
    return { error: 'Datei zu gross (max. 20 MB)' }
  }

  const text = await file.text()
  const rows = parseMfpNutritionCsv(text)
  if (rows.length === 0) {
    return { error: 'Keine gültigen Nährwert-Zeilen gefunden. Ist das die MFP Nährwerte-/Nutrition-CSV (Spalten Datum/Mahlzeit bzw. Date/Meal)?' }
  }

  const summary = await importNutritionCsv(rows, prisma)
  revalidatePath('/admin/nutrition-import')
  revalidatePath('/admin/health-inventory')
  return { summary }
}
