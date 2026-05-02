'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export type MealPlanInput = {
  breakfast?: string | null
  snackMorning?: string | null
  lunch?: string | null
  snackAfternoon?: string | null
  dinner?: string | null
  snack?: string | null
}

export async function saveMealPlanAction(
  dateStr: string,
  input: MealPlanInput
): Promise<{ error?: string }> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  const date = new Date(`${dateStr}T00:00:00.000Z`)
  const data = {
    breakfast:      input.breakfast?.trim() || null,
    snackMorning:   input.snackMorning?.trim() || null,
    lunch:          input.lunch?.trim() || null,
    snackAfternoon: input.snackAfternoon?.trim() || null,
    dinner:         input.dinner?.trim() || null,
    snack:          input.snack?.trim() || null,
  }

  await prisma.mealPlan.upsert({
    where: { date },
    create: { date, ...data },
    update: data,
  })

  revalidatePath('/admin/meal-plan')
  return {}
}
