// =============================================================================
// Tages-Aggregation & Erfüllung (N-07)
//
// recomputeDay() bildet den IST (Summe der MealEntry-Snapshots), löst den SOLL
// (Phase/Eckdaten + Tag-Typ) auf, bewertet die Erfüllung tag-typ-abhängig und
// persistiert alles am Day (inkl. fulfillmentStatus — Basis der Blog-Kopplung
// in N-08). Wird nach jeder Log-Änderung aufgerufen.
// =============================================================================

import type { FulfillmentStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getOrCreateDay, dateOnly } from './day'
import { listDayEntries, sumEntries } from './meals'
import { resolveTargetsForDate } from './targets'
import { deriveRefeedSoll } from './refeed'
import { effectiveIsRefeed, evaluateFulfillment, isoWeekday } from './fulfillment'

export interface SollIst {
  kcal: number
  proteinG: number
  fatG: number
  carbsG: number
}

export interface DaySummary {
  date: Date
  phaseMode: string | null
  isRefeed: boolean
  soll: SollIst | null
  ist: SollIst & { count: number }
  fulfillmentStatus: FulfillmentStatus
}

/**
 * Berechnet SOLL/IST + Erfüllung eines Tages neu und speichert sie am Day.
 */
export async function recomputeDay(date: Date): Promise<DaySummary> {
  const d = dateOnly(date)
  const day = await getOrCreateDay(d)

  const [entries, targets, phase] = await Promise.all([
    listDayEntries(d),
    resolveTargetsForDate(d),
    day.phaseId
      ? prisma.phase.findUnique({ where: { id: day.phaseId }, include: { refeedRules: true } })
      : Promise.resolve(null),
  ])

  const ist = sumEntries(entries)
  const rules = phase?.refeedRules ?? []
  const isRefeed = effectiveIsRefeed(day.dayType === 'REFEED', isoWeekday(d), rules)
  const phaseMode = phase?.mode ?? null

  // --- SOLL bestimmen -------------------------------------------------------
  let soll: SollIst | null = null
  if (targets) {
    if (isRefeed) {
      const activeRule = rules.find((r) => r.active)
      if (activeRule) {
        soll = {
          kcal: activeRule.refeedKcal,
          proteinG: activeRule.refeedProteinG,
          fatG: activeRule.refeedFatG,
          carbsG: activeRule.refeedCarbsG,
        }
      } else {
        const derived = deriveRefeedSoll(targets)
        soll = { kcal: derived.kcal, proteinG: derived.proteinG, fatG: derived.fatG, carbsG: derived.carbsG }
      }
    } else {
      soll = {
        kcal: targets.targetKcal,
        proteinG: targets.proteinG,
        fatG: targets.fatG,
        carbsG: targets.carbsG,
      }
    }
  }

  const isDeficitDay = phaseMode === 'DEFICIT' && !isRefeed
  const fulfillmentStatus = evaluateFulfillment({
    istKcal: ist.kcal,
    sollKcal: soll?.kcal ?? null,
    isDeficitDay,
    hasEntries: ist.count > 0,
  })

  await prisma.day.update({
    where: { id: day.id },
    data: {
      targetKcal: soll?.kcal ?? null,
      targetProteinG: soll?.proteinG ?? null,
      targetFatG: soll?.fatG ?? null,
      targetCarbsG: soll?.carbsG ?? null,
      actualKcal: ist.kcal,
      actualProteinG: ist.proteinG,
      actualFatG: ist.fatG,
      actualCarbsG: ist.carbsG,
      fulfillmentStatus,
    },
  })

  return {
    date: d,
    phaseMode,
    isRefeed,
    soll,
    ist: { kcal: ist.kcal, proteinG: ist.proteinG, fatG: ist.fatG, carbsG: ist.carbsG, count: ist.count },
    fulfillmentStatus,
  }
}

/** Ad-hoc: einen Tag als Refeed (oder zurück auf Normal) markieren. */
export async function setDayRefeed(date: Date, refeed: boolean): Promise<DaySummary> {
  const day = await getOrCreateDay(dateOnly(date))
  await prisma.day.update({
    where: { id: day.id },
    data: { dayType: refeed ? 'REFEED' : 'NORMAL' },
  })
  return recomputeDay(date)
}
