import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getNutritionHistory } from '@/lib/nutrition/history'
import { NutritionHistoryCharts } from '@/components/nutrition/NutritionHistoryCharts'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ days?: string }>
}

const ALLOWED_DAYS = [14, 30, 90]

export default async function NutritionHistoryPage({ searchParams }: PageProps) {
  const session = await requireAdmin()
  if (!session) redirect('/admin/login')

  const { days: daysParam } = await searchParams
  const parsed = daysParam ? parseInt(daysParam, 10) : 30
  const days = ALLOWED_DAYS.includes(parsed) ? parsed : 30

  const { points, calibration } = await getNutritionHistory(days)

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-headline text-2xl font-bold text-on-surface">Verlauf & Kalibrierung</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          kcal SOLL/IST, Makros und Gewichtstrend. Die 14-Tage-Kalibrierung vergleicht das
          Durchschnittsgewicht der ersten mit der zweiten Woche.
        </p>
      </div>
      <NutritionHistoryCharts points={points} calibration={calibration} days={days} />
    </div>
  )
}
