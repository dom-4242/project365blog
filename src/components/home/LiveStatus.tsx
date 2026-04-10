import { getTranslations } from 'next-intl/server'
import { getAllEntries } from '@/lib/journal'
import { getLatestMetrics } from '@/lib/metrics'
import { getProfile } from '@/lib/profile'
import {
  calculateStreak,
  isMovementFulfilled,
  isNutritionFulfilled,
  isSmokingFulfilled,
} from '@/lib/habits'

// ─── Compact streak card ───────────────────────────────────────────────────

interface StreamCardProps {
  emoji: string
  label: string
  current: number
  streakDays: string
  textColorClass: string
  barColorClass: string
  pct: number
}

function StreamCard({ emoji, label, current, streakDays, textColorClass, barColorClass, pct }: StreamCardProps) {
  return (
    <div className="bg-surface-container border border-outline-variant/15 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-label font-bold tracking-widest uppercase ${textColorClass}`}>
          {label}
        </span>
        <span className="text-base leading-none" aria-hidden="true">{emoji}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-4xl font-headline font-bold tracking-tighter leading-none ${textColorClass}`}>
          {current}
        </span>
        <span className="text-xs text-on-surface-variant">{streakDays}</span>
      </div>
      <div className="h-0.5 bg-surface-container-high rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColorClass} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Metric card ───────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string
  value: string
  unit: string
  sub?: string
  icon: string
}

function MetricCard({ label, value, unit, sub, icon }: MetricCardProps) {
  return (
    <div className="bg-surface-container border border-outline-variant/15 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant">
          {label}
        </span>
        <span className="text-base leading-none" aria-hidden="true">{icon}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-4xl font-headline font-bold tracking-tighter leading-none text-on-surface">
          {value}
        </span>
        <span className="text-xs text-on-surface-variant">{unit}</span>
      </div>
      {sub && <p className="text-xs text-on-surface-variant">{sub}</p>}
    </div>
  )
}

// ─── Live Status section ───────────────────────────────────────────────────

export async function LiveStatus() {
  const [entries, metrics, profile, t] = await Promise.all([
    getAllEntries(),
    getLatestMetrics(),
    getProfile(),
    getTranslations('HomePage'),
  ])

  const movementStreak = calculateStreak(entries.map((e) => isMovementFulfilled(e.habits.movement)))
  const nutritionStreak = calculateStreak(entries.map((e) => isNutritionFulfilled(e.habits.nutrition)))
  const smokingStreak   = calculateStreak(entries.map((e) => isSmokingFulfilled(e.habits.smoking)))

  const total = entries.length
  const movementPct = total > 0 ? Math.round(entries.filter((e) => isMovementFulfilled(e.habits.movement)).length / total * 100) : 0
  const nutritionPct = total > 0 ? Math.round(entries.filter((e) => isNutritionFulfilled(e.habits.nutrition)).length / total * 100) : 0
  const smokingPct   = total > 0 ? Math.round(entries.filter((e) => isSmokingFulfilled(e.habits.smoking)).length / total * 100) : 0

  const streakDays = t('streakDays')
  const stepsGoal = profile.targetSteps ?? 10000

  const hasWeight = metrics.latestWeight !== undefined
  const hasSteps  = metrics.avgSteps30d  !== undefined

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 border-b border-outline-variant/10">

      {/* Section label */}
      <p className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant mb-4">
        {t('tagline')}
      </p>

      {/* Bento grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">

        {/* Habit streaks — 3 cells */}
        <StreamCard
          emoji="🏃"
          label={t('streakMovement').replace('Aktuelle ', '').replace('Current ', '')}
          current={movementStreak.current}
          streakDays={streakDays}
          textColorClass="text-movement-400"
          barColorClass="bg-movement-400"
          pct={movementPct}
        />
        <StreamCard
          emoji="🥗"
          label={t('streakNutrition').replace('Aktuelle ', '').replace('Current ', '')}
          current={nutritionStreak.current}
          streakDays={streakDays}
          textColorClass="text-nutrition-400"
          barColorClass="bg-nutrition-400"
          pct={nutritionPct}
        />
        <StreamCard
          emoji="🚭"
          label={t('streakSmoking').replace('Aktuelle ', '').replace('Current ', '')}
          current={smokingStreak.current}
          streakDays={streakDays}
          textColorClass="text-smoking-400"
          barColorClass="bg-smoking-400"
          pct={smokingPct}
        />

        {/* Metric cards — up to 2 cells (hidden on mobile if no data) */}
        {hasWeight && (
          <MetricCard
            label="Gewicht"
            value={metrics.latestWeight!.toFixed(1)}
            unit="kg"
            icon="⚖️"
          />
        )}
        {hasSteps && (
          <MetricCard
            label="Ø Schritte"
            value={metrics.avgSteps30d!.toLocaleString()}
            unit={`/ ${stepsGoal.toLocaleString()}`}
            sub="30-Tage Ø"
            icon="👣"
          />
        )}

      </div>
    </section>
  )
}
