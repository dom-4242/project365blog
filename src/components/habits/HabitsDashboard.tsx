import { getTranslations } from 'next-intl/server'
import { getAllEntries } from '@/lib/journal'
import { getProjectStartDate } from '@/lib/project-config'
import {
  isMovementFulfilled,
  isNutritionFulfilled,
  isSmokingFulfilled,
  getMovementLevel,
  getNutritionLevel,
  getSmokingLevel,
  SICK_LEVEL,
} from '@/lib/habits'
import { HabitPillar } from './HabitPillar'
import { HabitYearGrid } from './HabitYearGrid'

function generateDateRange(from: string, to: string): string[] {
  const dates: string[] = []
  const curr = new Date(from + 'T00:00:00')
  const end = new Date(to + 'T00:00:00')
  while (curr <= end) {
    dates.push(curr.toISOString().slice(0, 10))
    curr.setDate(curr.getDate() + 1)
  }
  return dates
}

export async function HabitsDashboard() {
  const [entries, t, startDate] = await Promise.all([
    getAllEntries(),
    getTranslations('HabitsDashboard'),
    getProjectStartDate(),
  ])
  const entryMap = new Map(entries.map((e) => [e.date, e]))

  const today = new Date().toISOString().slice(0, 10)
  const allDates = generateDateRange(startDate, today)

  const movementDays = allDates.map((date) => {
    const e = entryMap.get(date)
    return {
      date,
      level: e ? (e.sickDay ? SICK_LEVEL : getMovementLevel(e.habits.movement)) : -1,
    }
  })
  const nutritionDays = allDates.map((date) => {
    const e = entryMap.get(date)
    return {
      date,
      level: e ? (e.sickDay ? SICK_LEVEL : getNutritionLevel(e.habits.nutrition, e.mealScore)) : -1,
    }
  })
  const smokingDays = allDates.map((date) => {
    const e = entryMap.get(date)
    return {
      date,
      level: e ? (e.sickDay ? SICK_LEVEL : getSmokingLevel(e.habits.smoking)) : -1,
    }
  })

  // Krankheitstage zählen weder in Zähler noch Nenner der Erfüllungsquoten
  const activeEntries = entries.filter((e) => !e.sickDay)
  const movementFulfilled = activeEntries.filter((e) => isMovementFulfilled(e.habits.movement)).length
  const nutritionFulfilled = activeEntries.filter((e) => isNutritionFulfilled(e.habits.nutrition, e.mealScore)).length
  const smokingFulfilled = activeEntries.filter((e) => isSmokingFulfilled(e.habits.smoking)).length

  // Letzte 30 Tage (Tage mit Eintrag, max 30 jüngste)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 29)
  const cutoffISO = cutoff.toISOString().slice(0, 10)
  const recent = activeEntries.filter((e) => e.date >= cutoffISO)
  const recentTotal = recent.length
  const movementRecent = recent.filter((e) => isMovementFulfilled(e.habits.movement)).length
  const nutritionRecent = recent.filter((e) => isNutritionFulfilled(e.habits.nutrition, e.mealScore)).length
  const smokingRecent = recent.filter((e) => isSmokingFulfilled(e.habits.smoking)).length

  return (
    <section className="mb-14 space-y-6">

      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant">
          {t('heading')}
        </h2>
        <span className="text-xs text-on-surface-variant">
          {t('dayCount', { count: entries.length })}
        </span>
      </div>

      {/* Bento grid — three pillar cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <HabitPillar
          pillar="movement"
          totalFulfilled={movementFulfilled}
          totalEntries={activeEntries.length}
          recentFulfilled={movementRecent}
          recentTotal={recentTotal}
        />
        <HabitPillar
          pillar="nutrition"
          totalFulfilled={nutritionFulfilled}
          totalEntries={activeEntries.length}
          recentFulfilled={nutritionRecent}
          recentTotal={recentTotal}
        />
        <HabitPillar
          pillar="smoking"
          totalFulfilled={smokingFulfilled}
          totalEntries={activeEntries.length}
          recentFulfilled={smokingRecent}
          recentTotal={recentTotal}
        />
      </div>

      {/* Year grid — full width bento cell */}
      <div className="bg-surface-container border border-outline-variant/15 rounded-xl overflow-hidden">
        <HabitYearGrid
          movementDays={movementDays}
          nutritionDays={nutritionDays}
          smokingDays={smokingDays}
        />
      </div>

    </section>
  )
}
