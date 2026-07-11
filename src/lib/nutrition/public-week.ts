// =============================================================================
// Öffentliche 7-Tage-kcal-Kachel (Startseite) — Datenzugriff + Chart-Modell.
//
// Zeigt öffentlich SOLL/IST-kcal der letzten 7 Tage plus die aktuelle Phase
// (Defizit/Erhalt/Überschuss). Datenschutz: Der Aufrufer schaltet die Kachel
// nur frei, wenn der globale N-11-Schalter (getPublicSollIst) aktiv ist — hier
// werden ausschliesslich kcal-Werte gelesen, keine Makros/Mikros/Details.
//
// Die reine Chart-Mathematik (Balkenhöhen, SOLL-Linie, phasenabhängige
// Ziel-Zone) ist als testbare Funktion ausgelagert.
// =============================================================================

import type { PhaseMode } from '@prisma/client'
import { prisma } from '@/lib/db'
import { zurichDayStart } from '@/lib/timezone'
import { dateOnly } from './day'
import { resolveTargetsForDate, getActivePhase } from './targets'

export interface KcalWeekDay {
  date: string // YYYY-MM-DD
  ist: number | null
  /** FULFILLED → true, NOT_FULFILLED → false, OPEN/kein Log → null. */
  fulfilled: boolean | null
  isRefeed: boolean
}

export interface PublicKcalWeek {
  phaseMode: PhaseMode | null
  /** Aktuelles normales Tagesziel als Referenzlinie (kcal). */
  sollLine: number | null
  days: KcalWeekDay[] // genau 7, chronologisch (älteste zuerst)
  avgSoll: number | null
  avgIst: number | null
  hasData: boolean
}

function toKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Letzte 7 Kalendertage (chronologisch) als YYYY-MM-DD. */
function last7Keys(today: Date): string[] {
  const to = dateOnly(today)
  return Array.from({ length: 7 }, (_, i) =>
    toKey(new Date(to.getTime() - (6 - i) * 86_400_000)),
  )
}

/**
 * Öffentliche kcal-Woche für die Startseiten-Kachel. Liest nur kcal + Status
 * der letzten 7 Tage sowie die aktive Phase.
 */
export async function getPublicKcalWeek(): Promise<PublicKcalWeek> {
  const today = zurichDayStart()
  const keys = last7Keys(today)
  const from = dateOnly(new Date(dateOnly(today).getTime() - 6 * 86_400_000))
  const to = dateOnly(today)

  const [rows, targets, phase] = await Promise.all([
    prisma.day.findMany({
      where: { date: { gte: from, lte: to } },
      select: { date: true, actualKcal: true, targetKcal: true, fulfillmentStatus: true, dayType: true },
    }),
    resolveTargetsForDate(to),
    getActivePhase(),
  ])

  const byKey = new Map(rows.map((r) => [toKey(r.date), r]))

  const days: KcalWeekDay[] = keys.map((k) => {
    const r = byKey.get(k)
    const fulfilled =
      r?.fulfillmentStatus === 'FULFILLED'
        ? true
        : r?.fulfillmentStatus === 'NOT_FULFILLED'
          ? false
          : null
    return {
      date: k,
      ist: r?.actualKcal ?? null,
      fulfilled,
      isRefeed: r?.dayType === 'REFEED',
    }
  })

  // Ø nur über Tage mit geloggtem Ergebnis (FULFILLED/NOT_FULFILLED).
  const logged = keys
    .map((k) => byKey.get(k))
    .filter((r): r is NonNullable<typeof r> => !!r && r.fulfillmentStatus !== 'OPEN')
  const meanIst = logged.length
    ? Math.round(logged.reduce((a, r) => a + (r.actualKcal ?? 0), 0) / logged.length)
    : null
  const sollValues = logged.map((r) => r.targetKcal).filter((v): v is number => v != null)
  const meanSoll = sollValues.length
    ? Math.round(sollValues.reduce((a, b) => a + b, 0) / sollValues.length)
    : null

  return {
    phaseMode: phase?.mode ?? null,
    sollLine: targets ? Math.round(targets.targetKcal) : meanSoll,
    days,
    avgSoll: meanSoll ?? (targets ? Math.round(targets.targetKcal) : null),
    avgIst: meanIst,
    hasData: logged.length > 0,
  }
}

// --- Reines Chart-Modell (testbar) ------------------------------------------

export interface KcalBar {
  date: string
  /** Balkenhöhe in % der Chart-Höhe (0 wenn kein IST). */
  heightPct: number
  fulfilled: boolean | null
  isRefeed: boolean
  hasValue: boolean
}

export interface KcalZone {
  topPct: number
  heightPct: number
}

export interface KcalChartModel {
  bars: KcalBar[]
  /** SOLL-Linie: Abstand von oben in % (null wenn kein SOLL). */
  sollTopPct: number | null
  /** Phasenabhängige Ziel-Zone (null wenn kein SOLL/keine Phase). */
  zone: KcalZone | null
  max: number
}

const clampPct = (n: number) => Math.max(0, Math.min(100, n))

/** Erhalt-Band = ±5 % ums SOLL (analog zur Erfüllungs-Toleranz). */
export const MAINTENANCE_BAND = 0.05

/**
 * Rechnet Balkenhöhen, SOLL-Linie und Ziel-Zone in Prozent der Chart-Höhe.
 * Zone: Defizit = unter der Linie, Überschuss = darüber, Erhalt = ±5 %-Band.
 */
export function computeKcalChartModel(
  days: KcalWeekDay[],
  sollLine: number | null,
  phaseMode: PhaseMode | null,
  band = MAINTENANCE_BAND,
): KcalChartModel {
  const istValues = days.map((d) => d.ist).filter((v): v is number => v != null)
  const peak = Math.max(sollLine ?? 0, ...istValues, 0)
  const max = peak > 0 ? peak * 1.15 : 1

  const bars: KcalBar[] = days.map((d) => ({
    date: d.date,
    heightPct: d.ist != null ? clampPct((d.ist / max) * 100) : 0,
    fulfilled: d.fulfilled,
    isRefeed: d.isRefeed,
    hasValue: d.ist != null,
  }))

  if (sollLine == null || sollLine <= 0) {
    return { bars, sollTopPct: null, zone: null, max }
  }

  const sollTopPct = clampPct((1 - sollLine / max) * 100)

  let zone: KcalZone | null = null
  if (phaseMode === 'DEFICIT') {
    zone = { topPct: sollTopPct, heightPct: clampPct(100 - sollTopPct) }
  } else if (phaseMode === 'SURPLUS') {
    zone = { topPct: 0, heightPct: sollTopPct }
  } else if (phaseMode === 'MAINTENANCE') {
    const hiTop = clampPct((1 - (sollLine * (1 + band)) / max) * 100)
    const loTop = clampPct((1 - (sollLine * (1 - band)) / max) * 100)
    zone = { topPct: hiTop, heightPct: clampPct(loTop - hiTop) }
  }

  return { bars, sollTopPct, zone, max }
}
