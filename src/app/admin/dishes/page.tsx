import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DishManager } from '@/components/nutrition/DishManager'
import { listDishes } from '@/lib/nutrition/dishes'
import { listFoodItems } from '@/lib/nutrition/food'
import { favoriteIdSets } from '@/lib/nutrition/favorites'

export const dynamic = 'force-dynamic'

export default async function DishesPage() {
  const session = await requireAdmin()
  if (!session) redirect('/admin/login')

  const [dishes, catalog, favs] = await Promise.all([
    listDishes(true),
    listFoodItems(false),
    favoriteIdSets(),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-headline text-2xl font-bold text-on-surface">Gerichte</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Wiederverwendbare Kombinationen (z.&nbsp;B. Frühstück). Als ★ Favorit für 1-Klick im Log.
        </p>
      </div>
      <DishManager dishes={dishes} catalog={catalog} favoriteDishIds={[...favs.dishes]} />
    </div>
  )
}
