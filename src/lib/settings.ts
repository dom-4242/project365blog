import { cache } from 'react'
import { prisma } from '@/lib/db'

export type PriorityPillar = 'smoking' | 'movement' | 'nutrition'

export const getPriorityPillar = cache(async (): Promise<PriorityPillar> => {
  const setting = await prisma.appSetting.findUnique({ where: { key: 'priority_pillar' } })
  const value = setting?.value
  if (value === 'movement' || value === 'nutrition' || value === 'smoking') return value
  return 'smoking'
})

/** AppSetting-Key für die öffentliche kcal-SOLL/IST-Anzeige (N-11). */
export const PUBLIC_SOLL_IST_KEY = 'nutrition_public_soll_ist'

/**
 * Zeigt die öffentliche Ansicht kcal SOLL/IST je Tag an? Globaler Schalter
 * (N-11). Default aus (nur „erfüllt/nicht" öffentlich). Nur die kcal-Ebene wird
 * je freigeschaltet — niemals Makros, Mikros oder Mahlzeit-Details.
 */
export const getPublicSollIst = cache(async (): Promise<boolean> => {
  const setting = await prisma.appSetting.findUnique({ where: { key: PUBLIC_SOLL_IST_KEY } })
  return setting?.value === 'true'
})
