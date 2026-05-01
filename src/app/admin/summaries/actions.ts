'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { generateAndSaveMonthSummary } from '@/lib/month-summary'

export async function generateSummaryAction(year: number, month: number) {
  await generateAndSaveMonthSummary(year, month)
  revalidatePath('/admin/summaries')
  const summary = await prisma.monthSummary.findUnique({ where: { year_month: { year, month } } })
  if (summary) {
    redirect(`/admin/summaries/${summary.id}/edit`)
  }
}

export async function updateSummaryAction(id: string, contentDe: string, contentEn: string, contentPt: string) {
  await prisma.monthSummary.update({
    where: { id },
    data: { contentDe, contentEn, contentPt },
  })
  revalidatePath('/admin/summaries')
  revalidatePath(`/de/monthly`)
  revalidatePath(`/en/monthly`)
  revalidatePath(`/pt/monthly`)
}

export async function deleteSummaryAction(id: string) {
  await prisma.monthSummary.delete({ where: { id } })
  revalidatePath('/admin/summaries')
  redirect('/admin/summaries')
}
