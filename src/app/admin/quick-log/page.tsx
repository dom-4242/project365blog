import { prisma } from '@/lib/db'
import { QuickLogButtons } from '@/components/admin/QuickLogButtons'
import { DRINK_VOLUME } from '@/lib/drinks'
import { zurichDayStart, formatZurichTime } from '@/lib/timezone'

export const dynamic = 'force-dynamic'

export default async function QuickLogPage() {
  const start = zurichDayStart()

  const [todayEntries, todaySweetsLog] = await Promise.all([
    prisma.drinkLog.findMany({
      where: { timestamp: { gte: start } },
      orderBy: { timestamp: 'desc' },
    }),
    prisma.sweetsLog.findUnique({
      where: { date: start },
    }),
  ])

  const water = todayEntries.filter((e) => e.type === 'WATER').length
  const colaZero = todayEntries.filter((e) => e.type === 'COLA_ZERO').length
  const totalMl = water * DRINK_VOLUME.WATER + colaZero * DRINK_VOLUME.COLA_ZERO

  const recentEntries = todayEntries.map((e) => ({
    id: e.id,
    type: e.type,
    time: formatZurichTime(e.timestamp),
  }))

  return (
    <div className="max-w-sm mx-auto space-y-8 py-4">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">Quick Log</h1>
        <p className="text-on-surface-variant text-sm">Getränke und Süssigkeiten erfassen</p>
      </div>

      {/* Today's summary */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-surface-container rounded-xl p-3">
          <p className="text-2xl font-bold text-on-surface">{water}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">💧 Flaschen</p>
        </div>
        <div className="bg-surface-container rounded-xl p-3">
          <p className="text-2xl font-bold text-on-surface">{colaZero}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">🥤 Dosen</p>
        </div>
        <div className="bg-surface-container rounded-xl p-3">
          <p className="text-2xl font-bold text-on-surface">{(totalMl / 1000).toFixed(1)}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">Liter total</p>
        </div>
      </div>

      <QuickLogButtons
        recentEntries={recentEntries}
        sweetsConsumed={todaySweetsLog?.consumed ?? null}
      />
    </div>
  )
}
