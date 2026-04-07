import { getTranslations } from 'next-intl/server'
import { getAllEntries } from '@/lib/journal'
import { getProjectStartDate } from '@/lib/project-config'
import {
  calculateStreak,
  isMovementFulfilled,
  isNutritionFulfilled,
  isSmokingFulfilled,
  getMovementLevel,
  getNutritionLevel,
  getSmokingLevel,
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

  const movementDays = allDates.map((date) => ({
    date,
    level: entryMap.has(date) ? getMovementLevel(entryMap.get(date)!.habits.movement) : -1,
  }))
  const nutritionDays = allDates.map((date) => ({
    date,
    level: entryMap.has(date) ? getNutritionLevel(entryMap.get(date)!.habits.nutrition) : -1,
  }))
  const smokingDays = allDates.map((date) => ({
    date,
    level: entryMap.has(date) ? getSmokingLevel(entryMap.get(date)!.habits.smoking) : -1,
  }))

  // Streaks berechnen (newest first → wie calculateStreak erwartet)
  const movementStreak = calculateStreak(entries.map((e) => isMovementFulfilled(e.habits.movement)))
  const nutritionStreak = calculateStreak(entries.map((e) => isNutritionFulfilled(e.habits.nutrition)))
  const smokingStreak = calculateStreak(entries.map((e) => isSmokingFulfilled(e.habits.smoking)))

  const movementFulfilled = entries.filter((e) => isMovementFulfilled(e.habits.movement)).length
  const nutritionFulfilled = entries.filter((e) => isNutritionFulfilled(e.habits.nutrition)).length
  const smokingFulfilled = entries.filter((e) => isSmokingFulfilled(e.habits.smoking)).length

  return (
    <section className="mb-14">
      <div className="flex items-baseline gap-3 mb-5">
        <h2 className="font-display text-xl font-bold text-[#1a1714] dark:text-[#faf9f7]">{t('heading')}</h2>
        <span className="text-xs text-sand-400 font-medium tracking-wide uppercase">
          {t('dayCount', { count: entries.length })}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <HabitPillar
          pillar="movement"
          streak={movementStreak}
          totalFulfilled={movementFulfilled}
          totalEntries={entries.length}
          days={movementDays}
        />
        <HabitPillar
          pillar="nutrition"
          streak={nutritionStreak}
          totalFulfilled={nutritionFulfilled}
          totalEntries={entries.length}
          days={nutritionDays}
        />
        <HabitPillar
          pillar="smoking"
          streak={smokingStreak}
          totalFulfilled={smokingFulfilled}
          totalEntries={entries.length}
          days={smokingDays}
        />
      </div>

      <HabitYearGrid
        movementDays={movementDays}
        nutritionDays={nutritionDays}
        smokingDays={smokingDays}
      />
    </section>
  )
}
