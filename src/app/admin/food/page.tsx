import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { listFoodItems } from '@/lib/nutrition/food'
import { FoodCatalog } from '@/components/admin/FoodCatalog'

export const dynamic = 'force-dynamic'

export default async function FoodPage() {
  const session = await requireAdmin()
  if (!session) redirect('/admin/login')

  const catalog = await listFoodItems(true) // inkl. archivierter Einträge

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-headline text-2xl font-bold text-on-surface">Lebensmittel-Katalog</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Produkte aus Open Food Facts übernehmen oder manuell anlegen. Nährwerte je 100 g/ml.
        </p>
      </div>
      <FoodCatalog catalog={catalog} />
    </div>
  )
}
