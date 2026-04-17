import { cache } from 'react'
import { prisma } from '@/lib/db'

export type PriorityPillar = 'smoking' | 'movement' | 'nutrition'

export const getPriorityPillar = cache(async (): Promise<PriorityPillar> => {
  const setting = await prisma.appSetting.findUnique({ where: { key: 'priority_pillar' } })
  const value = setting?.value
  if (value === 'movement' || value === 'nutrition' || value === 'smoking') return value
  return 'smoking'
})
