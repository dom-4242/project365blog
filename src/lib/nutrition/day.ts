// =============================================================================
// Day-Auflösung (N-05) — legt bei Bedarf einen Kalendertag an und verknüpft
// ihn mit der aktiven Phase. SOLL-Snapshot, IST-Aggregat und Erfüllung setzt
// N-07; hier wird der Tag nur als Container für MealEntries sichergestellt.
// =============================================================================

import type { Day } from '@prisma/client'
import { prisma } from '@/lib/db'

/** 'YYYY-MM-DD' → UTC-Mitternacht (passend zu @db.Date). */
export function dateOnly(input: string | Date): Date {
  if (input instanceof Date) {
    return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()))
  }
  return new Date(`${input}T00:00:00.000Z`)
}

export async function getOrCreateDay(date: Date): Promise<Day> {
  const d = dateOnly(date)
  const existing = await prisma.day.findUnique({ where: { date: d } })
  if (existing) return existing
  const active = await prisma.phase.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { startDate: 'desc' },
  })
  return prisma.day.create({
    data: { date: d, phaseId: active?.id ?? null, dayType: 'NORMAL' },
  })
}
