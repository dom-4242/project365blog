import { prisma } from './db'

export interface UserProfile {
  heightCm: number | null
  targetWeight: number | null
  targetSteps: number | null
}

const PROFILE_ID = 'singleton'

export async function getProfile(): Promise<UserProfile> {
  const row = await prisma.userProfile.findUnique({ where: { id: PROFILE_ID } })
  return {
    heightCm: row?.heightCm ?? null,
    targetWeight: row?.targetWeight ?? null,
    targetSteps: row?.targetSteps ?? null,
  }
}

/**
 * Berechnet BMI aus Gewicht (kg) und Körpergrösse (cm).
 * Gibt null zurück wenn Werte fehlen.
 */
export function calculateBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10
}
