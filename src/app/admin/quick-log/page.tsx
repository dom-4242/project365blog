import { prisma } from '@/lib/db'
import { QuickLogButtons } from '@/components/admin/QuickLogButtons'
import { SweetsHistory } from '@/components/admin/SweetsHistory'
import { MealLogForm } from '@/components/admin/MealLogForm'
import { DRINK_VOLUME } from '@/lib/drinks'
import { zurichDayStart, zurichDateStr, formatZurichTime } from '@/lib/timezone'
import { getMealLog } from '@/lib/meal-log'

export const dynamic = 'force-dynamic'

export default async function QuickLogPage() {
  const drinkStart = zurichDayStart()
  const todayDateStr = zurichDateStr()
  const todayDate = new Date(`${todayDateStr}T00:00:00.000Z`)
  const historyFrom = new Date(todayDate.getTime() - 13 * 24 * 60 * 60 * 1000)

  const [todayEntries, todaySweetsLog, sweetsHistory, todayMealLog] = await Promise.all([
    prisma.drinkLog.findMany({
      where: { timestamp: { gte: drinkStart } },
      orderBy: { timestamp: 'desc' },
    }),
    prisma.sweetsLog.findUnique({
      where: { date: todayDate },
    }),
    prisma.sweetsLog.findMany({
      where: { date: { gte: historyFrom, lt: todayDate } },
      orderBy: { date: 'desc' },
    }),
    getMealLog(todayDateStr),
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
    <div className="max-w-lg mx-auto space-y-8 py-4">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">Quick Log</h1>
        <p className="text-on-surface-variant text-sm">Mahlzeiten, Getränke und Süssigkeiten erfassen</p>
      </div>

      {/* Mahlzeiten */}
      <MealLogForm dateStr={todayDateStr} initial={todayMealLog} />

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

      <SweetsHistory
        entries={sweetsHistory.map((e) => ({
          date: e.date.toISOString().slice(0, 10),
          consumed: e.consumed,
        }))}
        todayStr={zurichDateStr()}
      />
    </div>
  )
}
