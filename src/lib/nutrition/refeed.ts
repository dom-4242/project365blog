// =============================================================================
// Refeed-Regeln (N-07) — wiederkehrende Refeed-Wochentage je Phase + Refeed-SOLL.
//
// Refeed-SOLL (Fibel): kcal = Erhaltungskalorien, Protein 1,6 g/kg, Fett
// 0,5 g/kg, KH = Rest. Ist keine Regel konfiguriert, wird das SOLL aus den
// gültigen Eckdaten abgeleitet (Erhaltungskalorien = TDEE aus computeEckdaten).
// =============================================================================

import type { NutritionTargets, RefeedRule } from '@prisma/client'
import { prisma } from '@/lib/db'
import { computeEckdaten, computeRefeedTargets, type RefeedTargets } from './calc'

/** Erhaltungskalorien (TDEE) aus einem Eckdaten-Satz. */
export function maintenanceKcalFromTargets(t: NutritionTargets): number {
  return computeEckdaten({
    weightKg: t.baseWeightKg,
    heightCm: t.heightCm,
    age: t.age,
    sex: t.sex,
    bodyFatPct: t.bodyFatPct,
    activityFactor: t.activityFactor,
    phaseMode: 'DEFICIT',
    deficitMethod: t.deficitMode,
  }).maintenanceKcal
}

/** Refeed-SOLL aus Eckdaten ableiten (wenn keine explizite Regel greift). */
export function deriveRefeedSoll(t: NutritionTargets): RefeedTargets {
  return computeRefeedTargets(maintenanceKcalFromTargets(t), t.baseWeightKg)
}

export function listRefeedRules(phaseId: string): Promise<RefeedRule[]> {
  return prisma.refeedRule.findMany({ where: { phaseId }, orderBy: { createdAt: 'asc' } })
}

export function getActiveRefeedRule(phaseId: string): Promise<RefeedRule | null> {
  return prisma.refeedRule.findFirst({ where: { phaseId, active: true } })
}

/**
 * Setzt die (eine) aktive Refeed-Regel einer Phase: wiederkehrende Wochentage
 * + Refeed-SOLL. Leere Wochentagsliste deaktiviert die Regel.
 */
export async function saveRefeedRule(args: {
  phaseId: string
  recurringWeekdays: number[]
  soll: RefeedTargets
}): Promise<RefeedRule> {
  const existing = await prisma.refeedRule.findFirst({ where: { phaseId: args.phaseId } })
  const data = {
    recurringWeekdays: args.recurringWeekdays,
    refeedKcal: args.soll.kcal,
    refeedProteinG: args.soll.proteinG,
    refeedFatG: args.soll.fatG,
    refeedCarbsG: args.soll.carbsG,
    active: args.recurringWeekdays.length > 0,
  }
  if (existing) {
    return prisma.refeedRule.update({ where: { id: existing.id }, data })
  }
  return prisma.refeedRule.create({ data: { phaseId: args.phaseId, ...data } })
}
