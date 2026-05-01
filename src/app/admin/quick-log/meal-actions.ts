'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { calculateMealScore, scoreToNutritionLevel, type MealInput } from '@/lib/meal-log'

export async function saveMealLogAction(dateStr: string, input: MealInput) {
  const date = new Date(`${dateStr}T00:00:00.000Z`)
  const score = calculateMealScore(input)
  const nutritionLevel = scoreToNutritionLevel(score)

  await prisma.mealLog.upsert({
    where: { date },
    create: { date, ...input, score },
    update: { ...input, score },
  })

  // Auto-update JournalEntry nutrition if one exists for this date
  const entry = await prisma.journalEntry.findFirst({
    where: { date: { gte: date, lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) } },
  })
  if (entry) {
    await prisma.journalEntry.update({
      where: { id: entry.id },
      data: { nutrition: nutritionLevel },
    })
  }

  revalidatePath('/admin/quick-log')
}
