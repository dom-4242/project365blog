'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import type { PriorityPillar } from '@/lib/settings'

export interface ProfileFormData {
  heightCm: string
  targetWeight: string
  targetSteps: string
  projectStartDate: string
}

export interface ProfileActionResult {
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

export async function upsertProfile(data: ProfileFormData): Promise<ProfileActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  // Validate projectStartDate: must be YYYY-MM-DD and not in the future
  let projectStartDate: string | null = null
  if (data.projectStartDate.trim()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.projectStartDate)) {
      return { error: 'Startdatum muss im Format YYYY-MM-DD sein' }
    }
    const d = new Date(data.projectStartDate)
    if (isNaN(d.getTime())) {
      return { error: 'Ungültiges Startdatum' }
    }
    if (d > new Date()) {
      return { error: 'Startdatum darf nicht in der Zukunft liegen' }
    }
    projectStartDate = data.projectStartDate
  }

  const payload = {
    heightCm: toFloat(data.heightCm),
    targetWeight: toFloat(data.targetWeight),
    targetSteps: toInt(data.targetSteps),
    projectStartDate,
  }

  try {
    await prisma.userProfile.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...payload },
      update: payload,
    })

    revalidatePath('/admin/settings')
    revalidatePath('/')

    return { success: true }
  } catch (e) {
    console.error('upsertProfile:', e)
    return { error: 'Fehler beim Speichern' }
  }
}

export async function setPriorityPillar(pillar: PriorityPillar): Promise<{ error?: string; success?: boolean }> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  const allowed: PriorityPillar[] = ['smoking', 'movement', 'nutrition']
  if (!allowed.includes(pillar)) return { error: 'Ungültige Auswahl' }

  try {
    await prisma.appSetting.upsert({
      where: { key: 'priority_pillar' },
      create: { key: 'priority_pillar', value: pillar },
      update: { value: pillar },
    })

    revalidatePath('/admin/settings')
    revalidatePath('/de')
    revalidatePath('/en')
    revalidatePath('/pt')

    return { success: true }
  } catch (e) {
    console.error('setPriorityPillar:', e)
    return { error: 'Fehler beim Speichern' }
  }
}
