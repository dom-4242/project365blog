import Link from 'next/link'
import { getDrinkAnalytics, WATER_DAILY_TARGET_ML, COLA_ZERO_DAILY_LIMIT_ML } from '@/lib/drinks'
import { DrinkChartSection } from '@/components/admin/DrinkAnalyticsChart'

export const dynamic = 'force-dynamic'

const PERIODS = [
  { value: '7',   label: '7T' },
  { value: '30',  label: '30T' },
  { value: '90',  label: '90T' },
  { value: 'all', label: 'Alles' },
] as const

type Period = (typeof PERIODS)[number]['value']

function parsePeriod(raw: string | undefined): Period {
  const valid: Period[] = ['7', '30', '90', 'all']
  return valid.includes(raw as Period) ? (raw as Period) : '30'
}

interface PageProps {
  searchParams: { period?: string }
}

export default async function DrinksAnalyticsPage({ searchParams }: PageProps) {
  const period = parsePeriod(searchParams.period)
  const data = await getDrinkAnalytics(period === 'all' ? 'all' : parseInt(period))

  return (
    <div className="max-w-4xl space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">Getränke-Analytics</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {data.days.length > 0
              ? `${data.days.length} Tage · ${data.days[0].date} – ${data.days[data.days.length - 1].date}`
              : 'Keine Daten vorhanden'}
          </p>
        </div>

        {/* Period toggle */}
        <div className="flex gap-1 bg-surface-container rounded-lg p-1">
          {PERIODS.map(({ value, label }) => (
            <Link
              key={value}
              href={`/admin/drinks?period=${value}`}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                period === value
                  ? 'bg-surface-container-high text-on-surface'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Water */}
      <DrinkChartSection
        title="💧 Wasser"
        days={data.days}
        dataKey="waterMl"
        stats={data.waterStats}
        barColor="#38bdf8"
        lineColor="#0284c7"
        accentClass="text-sky-400"
        goalMl={WATER_DAILY_TARGET_ML}
        goalLabel="Tagesziel"
        goalLineLabel="Ziel"
        moreIsBetter={true}
      />

      {/* Cola Zero */}
      <DrinkChartSection
        title="🥤 Cola Zero"
        days={data.days}
        dataKey="colaZeroMl"
        stats={data.colaStats}
        barColor="#f472b6"
        lineColor="#db2777"
        accentClass="text-pink-400"
        goalMl={COLA_ZERO_DAILY_LIMIT_ML}
        goalLabel="Tageslimit"
        goalLineLabel="Limit"
        moreIsBetter={false}
      />

    </div>
  )
}
