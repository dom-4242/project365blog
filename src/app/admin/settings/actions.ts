'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export interface ProfileFormData {
  heightCm: string
  targetWeight: string
  targetSteps: string
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

  const payload = {
    heightCm: toFloat(data.heightCm),
    targetWeight: toFloat(data.targetWeight),
    targetSteps: toInt(data.targetSteps),
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
