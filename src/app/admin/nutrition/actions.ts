'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { computeEckdaten, type EckdatenInput } from '@/lib/nutrition/calc'

// -----------------------------------------------------------------------------
// Formular-Datentyp (Strings — wie in den übrigen Admin-Actions)
// -----------------------------------------------------------------------------

export interface EckdatenFormData {
  weightKg: string
  heightCm: string
  age: string
  sex: 'MALE' | 'FEMALE'
  bodyFatPct: string
  activityFactor: string
  phaseMode: 'DEFICIT' | 'MAINTENANCE' | 'SURPLUS'
  deficitMethod: 'MODERATE' | 'AGGRESSIVE' | 'SIMPLE'
  validFrom: string // YYYY-MM-DD
  note: string
}

export interface ActionResult {
  error?: string
  success?: boolean
}

function toFloat(val: string): number | null {
  if (!val.trim()) return null
  const n = parseFloat(val.replace(',', '.'))
  return isNaN(n) ? null : n
}

/** Formular → validierter Rechen-Input (oder Fehlermeldung). */
function parseInput(data: EckdatenFormData): { input: EckdatenInput } | { error: string } {
  const weightKg = toFloat(data.weightKg)
  const heightCm = toFloat(data.heightCm)
  const age = toFloat(data.age)
  const activityFactor = toFloat(data.activityFactor)
  const bodyFatPct = toFloat(data.bodyFatPct)

  if (weightKg === null || weightKg <= 0) return { error: 'Gewicht (kg) ist erforderlich.' }
  if (heightCm === null || heightCm <= 0) return { error: 'Grösse (cm) ist erforderlich.' }
  if (age === null || age <= 0) return { error: 'Alter ist erforderlich.' }
  if (activityFactor === null || activityFactor <= 0)
    return { error: 'Aktivitätsfaktor ist erforderlich.' }
  if (data.sex !== 'MALE' && data.sex !== 'FEMALE') return { error: 'Geschlecht ungültig.' }

  return {
    input: {
      weightKg,
      heightCm,
      age,
      sex: data.sex,
      bodyFatPct,
      activityFactor,
      phaseMode: data.phaseMode,
      deficitMethod: data.deficitMethod,
    },
  }
}

function parseDate(val: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

function revalidate() {
  revalidatePath('/admin/nutrition')
}

// -----------------------------------------------------------------------------
// Neue Phase anlegen / wechseln
//   → berechnet Eckdaten serverseitig, legt eine NutritionTargets-Version an
//     (validFrom = Phasenstart) und schaltet die bisher aktive Phase auf
//     COMPLETED (endDate = Phasenstart − 1 Tag).
// -----------------------------------------------------------------------------

export async function createPhase(data: EckdatenFormData): Promise<ActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  const parsed = parseInput(data)
  if ('error' in parsed) return parsed

  const startDate = parseDate(data.validFrom)
  if (!startDate) return { error: 'Startdatum ungültig (YYYY-MM-DD).' }

  const eck = computeEckdaten(parsed.input)
  const prevEnd = new Date(startDate.getTime() - 24 * 60 * 60 * 1000)

  try {
    await prisma.$transaction(async (tx) => {
      // Bisher aktive Phase(n) beenden
      await tx.phase.updateMany({
        where: { status: 'ACTIVE' },
        data: { status: 'COMPLETED', endDate: prevEnd },
      })

      // Eckdaten-Version (idempotent je validFrom)
      const targets = await tx.nutritionTargets.upsert({
        where: { validFrom: startDate },
        update: {
          baseWeightKg: parsed.input.weightKg,
          sex: parsed.input.sex,
          heightCm: parsed.input.heightCm,
          age: parsed.input.age,
          bodyFatPct: parsed.input.bodyFatPct,
          activityFactor: parsed.input.activityFactor,
          deficitMode: data.deficitMethod,
          targetKcal: eck.targetKcal,
          proteinG: eck.proteinG,
          fatG: eck.fatG,
          carbsG: eck.carbsG,
          mealsPerDay: eck.mealsPerDay,
          calcNote: eck.calcNote,
        },
        create: {
          validFrom: startDate,
          baseWeightKg: parsed.input.weightKg,
          sex: parsed.input.sex,
          heightCm: parsed.input.heightCm,
          age: parsed.input.age,
          bodyFatPct: parsed.input.bodyFatPct,
          activityFactor: parsed.input.activityFactor,
          deficitMode: data.deficitMethod,
          targetKcal: eck.targetKcal,
          proteinG: eck.proteinG,
          fatG: eck.fatG,
          carbsG: eck.carbsG,
          mealsPerDay: eck.mealsPerDay,
          calcNote: eck.calcNote,
        },
      })

      await tx.phase.create({
        data: {
          mode: data.phaseMode,
          startDate,
          status: 'ACTIVE',
          targetsId: targets.id,
          note: data.note.trim() || null,
        },
      })
    })

    revalidate()
    return { success: true }
  } catch (e) {
    console.error('createPhase:', e)
    return { error: 'Fehler beim Anlegen der Phase.' }
  }
}

// -----------------------------------------------------------------------------
// Eckdaten neu berechnen (Kalibrierung innerhalb der laufenden Phase)
//   → legt eine neue NutritionTargets-Version an und verknüpft die aktive Phase
//     damit. Die Erfüllung vergangener Tage bleibt über deren SOLL-Snapshot stabil.
// -----------------------------------------------------------------------------

export async function addTargetsVersion(data: EckdatenFormData): Promise<ActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  const parsed = parseInput(data)
  if ('error' in parsed) return parsed

  const validFrom = parseDate(data.validFrom)
  if (!validFrom) return { error: 'Gültig-ab-Datum ungültig (YYYY-MM-DD).' }

  const active = await prisma.phase.findFirst({ where: { status: 'ACTIVE' } })
  if (!active) return { error: 'Keine aktive Phase — bitte zuerst eine Phase anlegen.' }

  const eck = computeEckdaten(parsed.input)

  try {
    const targets = await prisma.nutritionTargets.upsert({
      where: { validFrom },
      update: {
        baseWeightKg: parsed.input.weightKg,
        sex: parsed.input.sex,
        heightCm: parsed.input.heightCm,
        age: parsed.input.age,
        bodyFatPct: parsed.input.bodyFatPct,
        activityFactor: parsed.input.activityFactor,
        deficitMode: data.deficitMethod,
        targetKcal: eck.targetKcal,
        proteinG: eck.proteinG,
        fatG: eck.fatG,
        carbsG: eck.carbsG,
        mealsPerDay: eck.mealsPerDay,
        calcNote: eck.calcNote,
      },
      create: {
        validFrom,
        baseWeightKg: parsed.input.weightKg,
        sex: parsed.input.sex,
        heightCm: parsed.input.heightCm,
        age: parsed.input.age,
        bodyFatPct: parsed.input.bodyFatPct,
        activityFactor: parsed.input.activityFactor,
        deficitMode: data.deficitMethod,
        targetKcal: eck.targetKcal,
        proteinG: eck.proteinG,
        fatG: eck.fatG,
        carbsG: eck.carbsG,
        mealsPerDay: eck.mealsPerDay,
        calcNote: eck.calcNote,
      },
    })

    await prisma.phase.update({
      where: { id: active.id },
      data: { targetsId: targets.id },
    })

    revalidate()
    return { success: true }
  } catch (e) {
    console.error('addTargetsVersion:', e)
    return { error: 'Fehler beim Speichern der Eckdaten-Version.' }
  }
}

// -----------------------------------------------------------------------------
// Aktive Phase beenden (ohne Nachfolger)
// -----------------------------------------------------------------------------

export async function endActivePhase(endDateStr: string): Promise<ActionResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  const endDate = parseDate(endDateStr)
  if (!endDate) return { error: 'Enddatum ungültig (YYYY-MM-DD).' }

  try {
    const res = await prisma.phase.updateMany({
      where: { status: 'ACTIVE' },
      data: { status: 'COMPLETED', endDate },
    })
    if (res.count === 0) return { error: 'Keine aktive Phase vorhanden.' }
    revalidate()
    return { success: true }
  } catch (e) {
    console.error('endActivePhase:', e)
    return { error: 'Fehler beim Beenden der Phase.' }
  }
}
