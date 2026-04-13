'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export interface MeasurementFormData {
  date: string
  chest: string
  waist: string
  hip: string
  upperArmLeft: string
  upperArmRight: string
  thighLeft: string
  thighRight: string
  calfLeft: string
  calfRight: string
  neck: string
  notes: string
}

function parseFloat_(s: string): number | null {
  const v = parseFloat(s)
  return isNaN(v) ? null : v
}

export async function saveMeasurement(data: MeasurementFormData): Promise<{ error?: string }> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  const row = {
    chest:         parseFloat_(data.chest),
    waist:         parseFloat_(data.waist),
    hip:           parseFloat_(data.hip),
    upperArmLeft:  parseFloat_(data.upperArmLeft),
    upperArmRight: parseFloat_(data.upperArmRight),
    thighLeft:     parseFloat_(data.thighLeft),
    thighRight:    parseFloat_(data.thighRight),
    calfLeft:      parseFloat_(data.calfLeft),
    calfRight:     parseFloat_(data.calfRight),
    neck:          parseFloat_(data.neck),
    notes:         data.notes.trim() || null,
  }

  await prisma.bodyMeasurement.upsert({
    where: { date: new Date(data.date) },
    create: { date: new Date(data.date), ...row },
    update: row,
  })

  revalidatePath('/admin/body-measurements')
  revalidatePath('/de/metrics')
  revalidatePath('/en/metrics')
  return {}
}
