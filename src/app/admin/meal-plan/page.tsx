import { prisma } from '@/lib/db'
import { zurichDateStr } from '@/lib/timezone'
import { MealPlanForm } from '@/components/admin/MealPlanForm'

export const dynamic = 'force-dynamic'

const SLOTS = ['breakfast', 'snackMorning', 'lunch', 'snackAfternoon', 'dinner', 'snack'] as const
type Slot = (typeof SLOTS)[number]

function tomorrowDateStr(): string {
  return zurichDateStr(new Date(Date.now() + 24 * 60 * 60 * 1000))
}

export default async function MealPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const params = await searchParams
  const dateStr = params.date ?? tomorrowDateStr()
  const date = new Date(`${dateStr}T00:00:00.000Z`)

  const [plan, recentPlans] = await Promise.all([
    prisma.mealPlan.findUnique({ where: { date } }),
    prisma.mealPlan.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 50,
    }),
  ])

  // Build unique suggestions per slot from history (preserve insertion order, deduplicate)
  const suggestions: Record<Slot, string[]> = {
    breakfast: [],
    snackMorning: [],
    lunch: [],
    snackAfternoon: [],
    dinner: [],
    snack: [],
  }
  for (const slot of SLOTS) {
    const seen = new Set<string>()
    for (const p of recentPlans) {
      const val = p[slot]
      if (val && !seen.has(val)) {
        seen.add(val)
        suggestions[slot].push(val)
        if (suggestions[slot].length >= 30) break
      }
    }
  }

  const initial = plan
    ? {
        breakfast:      plan.breakfast,
        snackMorning:   plan.snackMorning,
        lunch:          plan.lunch,
        snackAfternoon: plan.snackAfternoon,
        dinner:         plan.dinner,
        snack:          plan.snack,
      }
    : null

  return (
    <div className="max-w-lg mx-auto space-y-8 py-4">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">Mahlzeitenplan</h1>
        <p className="text-on-surface-variant text-sm">Mahlzeiten für den Tag planen</p>
      </div>
      <MealPlanForm key={dateStr} dateStr={dateStr} initial={initial} suggestions={suggestions} />
    </div>
  )
}
