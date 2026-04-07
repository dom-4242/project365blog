import { cache } from 'react'
import { prisma } from './db'

/** Fallback if no DB value is set */
export const FALLBACK_START_DATE = '2026-03-26'

/**
 * Returns the configured project start date (YYYY-MM-DD).
 * Uses React's `cache()` so it's deduplicated within a single request,
 * even when called from multiple components.
 */
export const getProjectStartDate = cache(async (): Promise<string> => {
  const profile = await prisma.userProfile.findUnique({
    where: { id: 'singleton' },
    select: { projectStartDate: true },
  })
  return profile?.projectStartDate ?? FALLBACK_START_DATE
})
