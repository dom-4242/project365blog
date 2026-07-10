// =============================================================================
// NutritionTargets & Phase — DB-Zugriff und Versionsauflösung (N-02)
//
// NutritionTargets sind versioniert über `validFrom`. Der je Tag geltende Satz
// ergibt sich aus dem jüngsten validFrom ≤ Tagesdatum. Die Auswahllogik ist als
// reine Funktion (pickTargetsForDate) ausgelagert und getestet.
// =============================================================================

import type { NutritionTargets, Phase } from '@prisma/client'
import { prisma } from '@/lib/db'
import { zurichDayStart } from '@/lib/timezone'

/** Nur Datum vergleichen (Zeitanteil ignorieren). */
function dayValue(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

/**
 * Reine Auflösung: jüngster Target-Satz mit validFrom ≤ date.
 * Erwartet eine (beliebig sortierte) Liste; gibt null zurück, wenn keiner greift.
 */
export function pickTargetsForDate<T extends { validFrom: Date }>(
  targets: T[],
  date: Date,
): T | null {
  const d = dayValue(date)
  let best: T | null = null
  for (const t of targets) {
    if (dayValue(t.validFrom) <= d) {
      if (!best || dayValue(t.validFrom) > dayValue(best.validFrom)) {
        best = t
      }
    }
  }
  return best
}

/** DB-Variante: gültige Eckdaten für ein Datum (Default: heute, Europe/Zurich). */
export async function resolveTargetsForDate(
  date: Date = zurichDayStart(),
): Promise<NutritionTargets | null> {
  return prisma.nutritionTargets.findFirst({
    where: { validFrom: { lte: date } },
    orderBy: { validFrom: 'desc' },
  })
}

/** Alle Target-Versionen, jüngste zuerst. */
export function listTargetVersions(): Promise<NutritionTargets[]> {
  return prisma.nutritionTargets.findMany({ orderBy: { validFrom: 'desc' } })
}

export type PhaseWithTargets = Phase & { targets: NutritionTargets | null }

/** Aktive Phase inkl. verknüpfter Eckdaten (oder null). */
export async function getActivePhase(): Promise<PhaseWithTargets | null> {
  return prisma.phase.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { startDate: 'desc' },
    include: { targets: true },
  })
}

/** Alle Phasen (jüngste zuerst) inkl. Eckdaten — für die Verlaufsanzeige. */
export function listPhases(): Promise<PhaseWithTargets[]> {
  return prisma.phase.findMany({
    orderBy: { startDate: 'desc' },
    include: { targets: true },
  })
}
