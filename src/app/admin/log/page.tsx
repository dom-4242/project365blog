import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { MealLogger } from '@/components/nutrition/MealLogger'
import { dateOnly } from '@/lib/nutrition/day'
import { listDayEntries } from '@/lib/nutrition/meals'
import { listFavorites } from '@/lib/nutrition/favorites'
import { listDishes } from '@/lib/nutrition/dishes'
import { recomputeDay } from '@/lib/nutrition/day-aggregate'
import { zurichDateStr } from '@/lib/timezone'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function LogPage({ searchParams }: PageProps) {
  const session = await requireAdmin()
  if (!session) redirect('/admin/login')

  const { date: dateParam } = await searchParams
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : zurichDateStr()
  const d = dateOnly(date)

  // recomputeDay persistiert SOLL/IST + Erfüllung und liefert die Tages-Summary.
  const [summary, entries, favorites, dishes] = await Promise.all([
    recomputeDay(d),
    listDayEntries(d),
    listFavorites(),
    listDishes(false),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-headline text-2xl font-bold text-on-surface">Mahlzeiten loggen</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Favoriten für 1-Klick, Katalog/Scan für den Rest. Snapshot wird beim Loggen fixiert.
        </p>
      </div>
      <MealLogger
        date={date}
        entries={entries}
        favorites={favorites}
        dishes={dishes}
        summary={summary}
      />
    </div>
  )
}
