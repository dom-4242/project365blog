'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export interface MetricsFormData {
  date: string
  weight: string
  bodyFat: string
  bmi: string
  steps: string
  activeMinutes: string
  caloriesBurned: string
  distance: string
  restingHR: string
  sleepDuration: string
}

export interface MetricsActionResult {
  error?: string
  success?: boolean
}

function toFloat(val: string): number | null {
  if (!val.trim()) return null
  const n = parseFloat(val.replace(',', '.'))
  return isNaN(n) ? null : n
}

function toInt(val: string): number | null {
  if (!val.trim()) return null
  const n = parseInt(val, 10)
  return isNaN(n) ? null : n
}

export async function upsertMetrics(data: MetricsFormData): Promise<MetricsActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  if (!data.date) return { error: 'Datum ist erforderlich' }

  const date = new Date(data.date)

  const payload = {
    weight: toFloat(data.weight),
    bodyFat: toFloat(data.bodyFat),
    bmi: toFloat(data.bmi),
    steps: toInt(data.steps),
    activeMinutes: toInt(data.activeMinutes),
    caloriesBurned: toInt(data.caloriesBurned),
    distance: toFloat(data.distance),
    restingHR: toInt(data.restingHR),
    sleepDuration: toInt(data.sleepDuration),
    source: 'MANUAL' as const,
  }

  try {
    await prisma.dailyMetrics.upsert({
      where: { date },
      create: { date, ...payload },
      update: payload,
    })

    revalidatePath('/')
    revalidatePath('/admin/metrics')

    return { success: true }
  } catch (e) {
    console.error('upsertMetrics:', e)
    return { error: 'Fehler beim Speichern' }
  }
}
