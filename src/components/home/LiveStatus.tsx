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
import {
  getDrinkAvg7d,
  WATER_DAILY_TARGET_ML,
  COLA_ZERO_DAILY_LIMIT_ML,
} from '@/lib/drinks'

// ─── SVG Ring Chart ────────────────────────────────────────────────────────

interface RingChartProps {
  pct: number          // 0–100
  color: string        // stroke color (hex)
  size?: number        // viewBox size (default 88)
  strokeWidth?: number // (default 7)
}

function RingChart({ pct, color, size = 88, strokeWidth = 7 }: RingChartProps) {
  const r = (size - strokeWidth * 2) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.min(pct, 100) / 100)
  const fontSize = size * 0.22

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {/* Track */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="#201f1f"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* Center label */}
      <text
        x={cx} y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={fontSize}
        fontWeight="700"
        fontFamily="'Space Grotesk', sans-serif"
      >
        {pct}%
      </text>
    </svg>
  )
}

// ─── Smoking Streak Hero Tile ──────────────────────────────────────────────

interface SmokingHeroProps {
  streak: number
  longestStreak: number
  pct: number
  labelStreak: string
  labelDays: string
  labelLongest: string
  labelRate: string
}

function SmokingHeroTile({ streak, longestStreak, pct, labelStreak, labelDays, labelLongest, labelRate }: SmokingHeroProps) {
  return (
    <div className="relative col-span-1 sm:col-span-2 lg:col-span-5 bg-surface-variant/40 backdrop-blur-xl border border-outline-variant/15 rounded-xl p-5 overflow-hidden flex flex-col gap-4">
      {/* Decorative background number */}
      <span
        className="pointer-events-none select-none absolute -right-4 -bottom-4 font-headline font-bold leading-none text-smoking-400/5"
        style={{ fontSize: '10rem' }}
        aria-hidden="true"
      >
        {streak}
      </span>

      {/* Header */}
      <p className="text-xs font-label font-bold tracking-widest uppercase text-smoking-400">
        {labelStreak}
      </p>

      {/* Main number */}
      <div className="flex items-baseline gap-2">
        <span className="text-7xl font-headline font-bold tracking-tighter leading-none text-smoking-300">
          {streak}
        </span>
        <span className="text-sm text-on-surface-variant">{labelDays}</span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="h-1 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-smoking-400 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-on-surface-variant">
            {labelRate}: <span className="text-smoking-300 font-semibold">{pct}%</span>
          </span>
          <span className="text-xs text-on-surface-variant">
            {labelLongest}: <span className="text-on-surface font-semibold">{longestStreak}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Habit Ring Tile ───────────────────────────────────────────────────────

interface HabitRingProps {
  label: string
  streak: number
  pct7d: number
  pct30d: number
  color: string        // hex
  labelDays: string
  label7d: string
}

function HabitRingTile({ label, streak, pct7d, pct30d, color, labelDays, label7d }: HabitRingProps) {
  const trend = pct7d - pct30d
  const trendSign = trend > 0 ? '+' : ''
  const trendColor = trend >= 0 ? 'text-on-surface-variant' : 'text-error'

  return (
    <div className="col-span-1 sm:col-span-1 lg:col-span-4 bg-surface-container-high border border-outline-variant/10 rounded-xl p-4 flex flex-col gap-3">
      <p className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant">
        {label}
      </p>

      {/* Ring + streak */}
      <div className="flex items-center gap-4">
        <RingChart pct={pct30d} color={color} size={80} strokeWidth={6} />

        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-headline font-bold tracking-tighter leading-none text-on-surface">
              {streak}
            </span>
            <span className="text-xs text-on-surface-variant">{labelDays}</span>
          </div>
          <span className={`text-xs font-semibold ${trendColor}`}>
            {label7d}: {trendSign}{trend}%
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Nutrition Ring Tile (smaller) ─────────────────────────────────────────

interface NutritionRingProps {
  label: string
  streak: number
  pct7d: number
  pct30d: number
  color: string
  labelDays: string
  label7d: string
}

function NutritionRingTile({ label, streak, pct7d, pct30d, color, labelDays, label7d }: NutritionRingProps) {
  const trend = pct7d - pct30d
  const trendSign = trend > 0 ? '+' : ''
  const trendColor = trend >= 0 ? 'text-on-surface-variant' : 'text-error'

  return (
    <div className="col-span-1 sm:col-span-1 lg:col-span-3 bg-surface-container-high border border-outline-variant/10 rounded-xl p-4 flex flex-col gap-3">
      <p className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant">
        {label}
      </p>

      <div className="flex flex-col items-center gap-2">
        <RingChart pct={pct30d} color={color} size={72} strokeWidth={6} />

        <div className="text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-headline font-bold tracking-tighter leading-none text-on-surface">
              {streak}
            </span>
            <span className="text-xs text-on-surface-variant">{labelDays}</span>
          </div>
          <p className={`text-xs font-semibold mt-0.5 ${trendColor}`}>
            {label7d}: {trendSign}{trend}%
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Weight Progress Tile ─────────────────────────────────────────────────

interface WeightTileProps {
  weight?: number
  bmi?: number
  targetWeight?: number | null
  lastSync?: Date
  labelWeight: string
  labelBmi: string
  labelTarget: string
  labelSync: string
  labelNoData: string
}

function WeightTile({ weight, bmi, targetWeight, lastSync, labelWeight, labelBmi, labelTarget, labelSync, labelNoData }: WeightTileProps) {
  const hasWeight = weight !== undefined
  const hasTarget = targetWeight !== null && targetWeight !== undefined

  // Progress: assume start weight was ~110kg (or derive from target gap)
  // We'll just show how close to target (pct = 0 = far, 100 = at/below target)
  let pct = 0
  const startReference = 110 // approximate start weight in kg
  if (hasWeight && hasTarget && weight! < startReference) {
    const totalNeeded = startReference - targetWeight!
    const achieved = startReference - weight!
    pct = totalNeeded > 0 ? Math.min(100, Math.round((achieved / totalNeeded) * 100)) : 100
  }

  const syncStr = lastSync
    ? lastSync.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null

  return (
    <div className="col-span-1 sm:col-span-2 lg:col-span-8 bg-surface-container border border-outline-variant/10 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant">
          {labelWeight}
        </p>
        {syncStr && (
          <span className="text-xs text-on-surface-variant shrink-0">
            {labelSync}: {syncStr}
          </span>
        )}
      </div>

      {hasWeight ? (
        <>
          <div className="flex items-end gap-6">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-headline font-bold tracking-tighter leading-none text-on-surface">
                  {weight!.toFixed(1)}
                </span>
                <span className="text-sm text-on-surface-variant">kg</span>
              </div>
              {bmi && (
                <p className="text-xs text-on-surface-variant mt-1">
                  {labelBmi}: <span className="text-on-surface font-semibold">{bmi}</span>
                </p>
              )}
            </div>
            {hasTarget && (
              <div className="text-right">
                <span className="text-xs text-on-surface-variant">{labelTarget}</span>
                <p className="text-2xl font-headline font-bold tracking-tighter text-primary">
                  {targetWeight} kg
                </p>
              </div>
            )}
          </div>

          {hasTarget && (
            <div className="space-y-1.5">
              <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-on-surface-variant text-right">
                {pct}% {labelTarget.toLowerCase()}
              </p>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-on-surface-variant">{labelNoData}</p>
      )}
    </div>
  )
}

// ─── Steps + Body Fat Stacked Tile ────────────────────────────────────────

interface StackedMetricProps {
  steps?: number
  stepsGoal: number
  bodyFat?: number
  labelSteps: string
  labelBodyFat: string
  labelAvg30d: string
}

function StackedMetricTile({ steps, stepsGoal, bodyFat, labelSteps, labelBodyFat, labelAvg30d }: StackedMetricProps) {
  const stepsPct = steps ? Math.min(100, Math.round((steps / stepsGoal) * 100)) : 0

  return (
    <div className="col-span-1 sm:col-span-2 lg:col-span-4 bg-surface-container-high border border-outline-variant/10 rounded-xl overflow-hidden flex flex-col">
      {/* Steps half */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant">
          {labelSteps}
        </p>
        {steps !== undefined ? (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-headline font-bold tracking-tighter leading-none text-on-surface">
                {steps.toLocaleString('de-CH')}
              </span>
              <span className="text-xs text-on-surface-variant">/ {stepsGoal.toLocaleString('de-CH')}</span>
            </div>
            <div className="h-1 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-movement-400 transition-all duration-700"
                style={{ width: `${stepsPct}%` }}
              />
            </div>
            <p className="text-xs text-on-surface-variant">{labelAvg30d}</p>
          </>
        ) : (
          <p className="text-sm text-on-surface-variant">—</p>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-outline-variant/10" />

      {/* Body Fat half */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant">
          {labelBodyFat}
        </p>
        {bodyFat !== undefined ? (
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-headline font-bold tracking-tighter leading-none text-on-surface">
              {bodyFat.toFixed(1)}
            </span>
            <span className="text-xs text-on-surface-variant">%</span>
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">—</p>
        )}
      </div>
    </div>
  )
}

// ─── Drink Metric Tile ────────────────────────────────────────────────────

interface DrinkMetricTileProps {
  label: string
  avgMl: number
  targetMl: number
  /** true = higher is better (water); false = lower is better (cola zero) */
  moreIsBetter: boolean
  labelGoal: string
  unit?: string
}

function DrinkMetricTile({ label, avgMl, targetMl, moreIsBetter, labelGoal, unit = 'ml' }: DrinkMetricTileProps) {
  const ratio = targetMl > 0 ? avgMl / targetMl : 0
  const barPct = Math.min(100, Math.round(ratio * 100))
  const goalMet = moreIsBetter ? avgMl >= targetMl : avgMl <= targetMl
  const barColor = goalMet ? 'bg-movement-400' : moreIsBetter ? 'bg-primary' : 'bg-error'
  const valueColor = goalMet ? 'text-movement-300' : 'text-on-surface'

  const display = unit === 'L'
    ? `${(avgMl / 1000).toFixed(1)} L`
    : `${avgMl} ml`
  const goalDisplay = unit === 'L'
    ? `${(targetMl / 1000).toFixed(1)} L`
    : `${targetMl} ml`

  return (
    <div className="col-span-1 sm:col-span-1 lg:col-span-6 bg-surface-container-high border border-outline-variant/10 rounded-xl p-4 flex flex-col gap-3">
      <p className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant">
        {label}
      </p>

      <div className="flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-3xl font-headline font-bold tracking-tighter leading-none ${valueColor}`}>
            {(avgMl / 1000).toFixed(1)}
          </span>
          <span className="text-xs text-on-surface-variant">L</span>
        </div>
        <span className="text-xs text-on-surface-variant shrink-0">
          {labelGoal}: {goalDisplay}
        </span>
      </div>

      <div className="space-y-1">
        <div className="h-1 bg-surface-container rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${barColor} transition-all duration-700`}
            style={{ width: `${barPct}%` }}
          />
        </div>
        <p className="text-xs text-on-surface-variant text-right">{barPct}%</p>
      </div>
    </div>
  )
}

// ─── Helper: compute 7-day vs 30-day success rate ─────────────────────────

function computeRates(booleans: boolean[]): { pct30d: number; pct7d: number } {
  const last30 = booleans.slice(0, 30)
  const last7  = booleans.slice(0, 7)
  const pct30d = last30.length > 0 ? Math.round(last30.filter(Boolean).length / last30.length * 100) : 0
  const pct7d  = last7.length  > 0 ? Math.round(last7.filter(Boolean).length  / last7.length  * 100) : 0
  return { pct30d, pct7d }
}

// ─── Live Status section ───────────────────────────────────────────────────

export async function LiveStatus() {
  const [entries, metrics, profile, drinkAvg, t] = await Promise.all([
    getAllEntries(),
    getLatestMetrics(),
    getProfile(),
    getDrinkAvg7d(),
    getTranslations('HomePage'),
  ])

  const movementBools = entries.map((e) => isMovementFulfilled(e.habits.movement))
  const nutritionBools = entries.map((e) => isNutritionFulfilled(e.habits.nutrition))
  const smokingBools   = entries.map((e) => isSmokingFulfilled(e.habits.smoking))

  const movementStreak = calculateStreak(movementBools)
  const nutritionStreak = calculateStreak(nutritionBools)
  const smokingStreak   = calculateStreak(smokingBools)

  const movementRates  = computeRates(movementBools)
  const nutritionRates = computeRates(nutritionBools)
  const smokingRates   = computeRates(smokingBools)

  const stepsGoal = profile.targetSteps ?? 10000

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 border-b border-outline-variant/10">

      {/* Section label */}
      <p className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant mb-4">
        {t('tagline')}
      </p>

      {/* Bento grid — 12-col on lg, 2-col on sm, 1-col on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">

        {/* Row 1 */}
        <SmokingHeroTile
          streak={smokingStreak.current}
          longestStreak={smokingStreak.longest}
          pct={smokingRates.pct30d}
          labelStreak={t('streakSmoking')}
          labelDays={t('streakDays')}
          labelLongest={t('streakLongest')}
          labelRate={t('rate30d')}
        />

        <HabitRingTile
          label={t('streakMovement')}
          streak={movementStreak.current}
          pct7d={movementRates.pct7d}
          pct30d={movementRates.pct30d}
          color="#62bc44"
          labelDays={t('streakDays')}
          label7d={t('trend7d')}
        />

        <NutritionRingTile
          label={t('streakNutrition')}
          streak={nutritionStreak.current}
          pct7d={nutritionRates.pct7d}
          pct30d={nutritionRates.pct30d}
          color="#fd8b50"
          labelDays={t('streakDays')}
          label7d={t('trend7d')}
        />

        {/* Row 2 */}
        <WeightTile
          weight={metrics.latestWeight}
          bmi={metrics.latestBmi}
          targetWeight={profile.targetWeight}
          lastSync={metrics.lastSyncDate}
          labelWeight={t('metricWeight')}
          labelBmi={t('metricBmi')}
          labelTarget={t('metricTarget')}
          labelSync={t('metricSync')}
          labelNoData={t('metricNoData')}
        />

        <StackedMetricTile
          steps={metrics.avgSteps30d}
          stepsGoal={stepsGoal}
          bodyFat={metrics.latestBodyFat}
          labelSteps={t('metricSteps')}
          labelBodyFat={t('metricBodyFat')}
          labelAvg30d={t('metricAvg30d')}
        />

        {/* Row 3 — Drink metrics */}
        <DrinkMetricTile
          label={t('metricWater')}
          avgMl={drinkAvg.waterMl}
          targetMl={WATER_DAILY_TARGET_ML}
          moreIsBetter={true}
          labelGoal={t('metricDailyGoal')}
        />

        <DrinkMetricTile
          label={t('metricColaZero')}
          avgMl={drinkAvg.colaZeroMl}
          targetMl={COLA_ZERO_DAILY_LIMIT_ML}
          moreIsBetter={false}
          labelGoal={t('metricDailyLimit')}
        />

      </div>
    </section>
  )
}
