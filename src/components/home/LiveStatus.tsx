import { getTranslations } from 'next-intl/server'
import { getAllEntries } from '@/lib/journal'
import { getLatestMetrics, getStepsHistory } from '@/lib/metrics'
import { getProfile } from '@/lib/profile'
import { getPriorityPillar } from '@/lib/settings'
import {
  calculateStreak,
  calculateSweetsStreak,
  computeSweetsRate30d,
  isMovementFulfilled,
  isNutritionFulfilled,
  isSmokingFulfilled,
} from '@/lib/habits'
import {
  getDrinkAvg7d,
  getSweetsHistory,
  WATER_DAILY_TARGET_ML,
  COLA_ZERO_DAILY_LIMIT_ML,
} from '@/lib/drinks'
import { StepsSparkline } from './StepsSparkline'

// ─── Constants ────────────────────────────────────────────────────────────
const TARGET_BODY_FAT_PCT = 15

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatSyncTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('de-CH', {
    timeZone: 'Europe/Zurich',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function clampPct(val: number): number {
  return Math.max(0, Math.min(100, Math.round(val)))
}

// ─── SVG Ring Chart ────────────────────────────────────────────────────────

interface RingChartProps {
  pct: number
  color: string
  size?: number
  strokeWidth?: number
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
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#201f1f" strokeWidth={strokeWidth} />
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

// ─── Glow styles per pillar ────────────────────────────────────────────────

const PILLAR_GLOW: Record<string, { border: string; shadow: string }> = {
  smoking:   { border: 'border-smoking-400/50',   shadow: '0 0 20px rgba(91,145,247,0.28), 0 0 6px rgba(91,145,247,0.14)' },
  movement:  { border: 'border-movement-400/50',  shadow: '0 0 20px rgba(98,188,68,0.28),  0 0 6px rgba(98,188,68,0.14)'  },
  nutrition: { border: 'border-nutrition-400/50', shadow: '0 0 20px rgba(253,139,80,0.28), 0 0 6px rgba(253,139,80,0.14)' },
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
  isPriority?: boolean
}

function SmokingHeroTile({ streak, longestStreak, pct, labelStreak, labelDays, labelLongest, labelRate, isPriority }: SmokingHeroProps) {
  const glow = isPriority ? PILLAR_GLOW.smoking : null
  return (
    <div
      className={`relative col-span-1 sm:col-span-1 lg:col-span-4 bg-surface-variant/40 backdrop-blur-xl rounded-xl p-5 overflow-hidden flex flex-col gap-4 transition-shadow ${glow ? `border ${glow.border}` : 'border border-outline-variant/15'}`}
      style={glow ? { boxShadow: glow.shadow } : undefined}
      role={isPriority ? 'region' : undefined}
      aria-label={isPriority ? 'Priorität: Rauchstopp' : undefined}
    >
      {isPriority && <span className="sr-only">Aktueller Fokus</span>}
      <span
        className="pointer-events-none select-none absolute -right-4 -bottom-4 font-headline font-bold leading-none text-smoking-400/5"
        style={{ fontSize: '10rem' }}
        aria-hidden="true"
      >
        {streak}
      </span>
      <p className="text-xs font-label font-bold tracking-widest uppercase text-smoking-400">
        {labelStreak}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-7xl font-headline font-bold tracking-tighter leading-none text-smoking-300">
          {streak}
        </span>
        <span className="text-sm text-on-surface-variant">{labelDays}</span>
      </div>
      <div className="space-y-1.5">
        <div className="h-1 bg-surface-container-high rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-smoking-400 transition-all duration-700" style={{ width: `${pct}%` }} />
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

// ─── Habit Streak Tile (Bewegung & Ernährung) ─────────────────────────────

interface HabitStreakTileProps {
  label: string
  streak: number
  longestStreak: number
  pct7d: number
  pct30d: number
  colorClass: string
  colorText: string
  labelDays: string
  labelRate: string
  labelLongest: string
  labelTrend: string
  isPriority?: boolean
  pillarKey?: string
}

function HabitStreakTile({
  label, streak, longestStreak, pct7d, pct30d,
  colorClass, colorText, labelDays, labelRate, labelLongest, labelTrend,
  isPriority, pillarKey,
}: HabitStreakTileProps) {
  const trend = pct7d - pct30d
  const trendSign = trend > 0 ? '+' : ''
  const trendColor = trend >= 0 ? 'text-on-surface-variant' : 'text-error'
  const glow = isPriority && pillarKey ? PILLAR_GLOW[pillarKey] : null

  return (
    <div
      className={`relative col-span-1 sm:col-span-1 lg:col-span-4 bg-surface-container-high rounded-xl p-4 overflow-hidden flex flex-col gap-3 transition-shadow ${glow ? `border ${glow.border}` : 'border border-outline-variant/10'}`}
      style={glow ? { boxShadow: glow.shadow } : undefined}
      role={isPriority ? 'region' : undefined}
      aria-label={isPriority && pillarKey ? `Priorität: ${label}` : undefined}
    >
      {isPriority && <span className="sr-only">Aktueller Fokus</span>}
      <span
        className={`pointer-events-none select-none absolute -right-3 -bottom-3 font-headline font-bold leading-none opacity-[0.04]`}
        style={{ fontSize: '8rem', color: 'currentColor' }}
        aria-hidden="true"
      >
        {streak}
      </span>
      <p className={`text-xs font-label font-bold tracking-widest uppercase ${colorText}`}>{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={`text-5xl font-headline font-bold tracking-tighter leading-none ${colorText} opacity-90`}>
          {streak}
        </span>
        <span className="text-sm text-on-surface-variant">{labelDays}</span>
      </div>
      <div className="space-y-1.5">
        <div className="h-1 bg-surface-container rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${colorClass} transition-all duration-700`} style={{ width: `${Math.min(100, pct30d)}%` }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-on-surface-variant">
            {labelRate}: <span className={`${colorText} font-semibold`}>{pct30d}%</span>
            <span className={`ml-2 font-semibold ${trendColor}`}>({labelTrend}: {trendSign}{trend}%)</span>
          </span>
          <span className="text-xs text-on-surface-variant">
            {labelLongest}: <span className="text-on-surface font-semibold">{longestStreak}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Trend Badge ──────────────────────────────────────────────────────────

function TrendBadge({ current, baseline, unit }: { current: number; baseline: number; unit: string }) {
  const delta = current - baseline
  if (Math.abs(delta) < 0.05) return null
  const isGood = delta < 0
  const sign = delta < 0 ? '−' : '+'
  const arrow = delta < 0 ? '↓' : '↑'
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded ${
      isGood ? 'text-movement-400 bg-movement-900/20' : 'text-secondary bg-secondary/10'
    }`}>
      {arrow} {sign}{Math.abs(delta).toFixed(1)}{unit}
    </span>
  )
}

// ─── Weight Progress Tile ──────────────────────────────────────────────────

interface WeightTileProps {
  weight?: number
  bmi?: number
  targetWeight?: number | null
  baselineWeight?: number
  importedAt?: Date
  labelWeight: string
  labelBmi: string
  labelTarget: string
  labelImport: string
  labelStart: string
  labelProgress: string
  labelNoData: string
}

function WeightTile({ weight, bmi, targetWeight, baselineWeight, importedAt, labelWeight, labelBmi, labelTarget, labelImport, labelStart, labelProgress, labelNoData }: WeightTileProps) {
  const hasWeight = weight !== undefined
  const hasTarget = targetWeight !== null && targetWeight !== undefined
  const hasBaseline = baselineWeight !== undefined

  let pct = 0
  if (hasWeight && hasTarget && hasBaseline) {
    const totalNeeded = baselineWeight! - targetWeight!
    const achieved = baselineWeight! - weight!
    if (totalNeeded > 0) pct = clampPct((achieved / totalNeeded) * 100)
  }

  const syncStr = importedAt ? formatSyncTimestamp(importedAt) : null

  return (
    <div className="col-span-1 sm:col-span-1 lg:col-span-6 bg-surface-container border border-outline-variant/10 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant">{labelWeight}</p>
        {syncStr && (
          <span className="text-xs text-on-surface-variant shrink-0">{labelImport}: {syncStr}</span>
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
                {hasBaseline && <TrendBadge current={weight!} baseline={baselineWeight!} unit=" kg" />}
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
                <p className="text-2xl font-headline font-bold tracking-tighter text-primary">{targetWeight} kg</p>
              </div>
            )}
          </div>

          {hasTarget && hasBaseline && (
            <div className="space-y-2">
              <p className="text-xs text-on-surface-variant">
                {labelStart}: <span className="text-on-surface font-semibold">{baselineWeight!.toFixed(1)} kg</span>
                {' → '}
                {labelTarget}: <span className="text-primary font-semibold">{targetWeight} kg</span>
              </p>
              <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-on-surface-variant text-right">
                <span className="text-on-surface font-semibold">{pct}%</span> {labelProgress}
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

// ─── Body Fat Tile ─────────────────────────────────────────────────────────

interface BodyFatTileProps {
  bodyFat?: number
  baselineBodyFat?: number
  importedAt?: Date
  labelBodyFat: string
  labelTarget: string
  labelImport: string
  labelStart: string
  labelProgress: string
  labelNoData: string
}

function BodyFatTile({ bodyFat, baselineBodyFat, importedAt, labelBodyFat, labelTarget, labelImport, labelStart, labelProgress, labelNoData }: BodyFatTileProps) {
  const hasBodyFat = bodyFat !== undefined
  const hasBaseline = baselineBodyFat !== undefined

  let pct = 0
  if (hasBodyFat && hasBaseline) {
    const totalNeeded = baselineBodyFat! - TARGET_BODY_FAT_PCT
    const achieved = baselineBodyFat! - bodyFat!
    if (totalNeeded > 0) pct = clampPct((achieved / totalNeeded) * 100)
  }

  const syncStr = importedAt ? formatSyncTimestamp(importedAt) : null

  return (
    <div className="col-span-1 sm:col-span-1 lg:col-span-6 bg-surface-container border border-outline-variant/10 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant">{labelBodyFat}</p>
        {syncStr && (
          <span className="text-xs text-on-surface-variant shrink-0">{labelImport}: {syncStr}</span>
        )}
      </div>

      {hasBodyFat ? (
        <>
          <div className="flex items-end gap-6">
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-headline font-bold tracking-tighter leading-none text-on-surface">
                {bodyFat!.toFixed(1)}
              </span>
              <span className="text-sm text-on-surface-variant">%</span>
              {hasBaseline && <TrendBadge current={bodyFat!} baseline={baselineBodyFat!} unit="%" />}
            </div>
            <div className="text-right">
              <span className="text-xs text-on-surface-variant">{labelTarget}</span>
              <p className="text-2xl font-headline font-bold tracking-tighter text-primary">{TARGET_BODY_FAT_PCT} %</p>
            </div>
          </div>

          {hasBaseline && (
            <div className="space-y-2">
              <p className="text-xs text-on-surface-variant">
                {labelStart}: <span className="text-on-surface font-semibold">{baselineBodyFat!.toFixed(1)} %</span>
                {' → '}
                {labelTarget}: <span className="text-primary font-semibold">{TARGET_BODY_FAT_PCT} %</span>
              </p>
              <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-on-surface-variant text-right">
                <span className="text-on-surface font-semibold">{pct}%</span> {labelProgress}
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

// ─── Steps Tile (full width with sparkline) ───────────────────────────────

interface StepsTileProps {
  avgSteps?: number
  stepsGoal: number
  stepsHistory: Array<{ date: string; steps: number }>
  importedAt?: Date
  labelSteps: string
  labelAvg30d: string
  labelImport: string
  labelNoData: string
}

function StepsTile({ avgSteps, stepsGoal, stepsHistory, importedAt, labelSteps, labelAvg30d, labelImport, labelNoData }: StepsTileProps) {
  const stepsPct = avgSteps ? Math.min(100, Math.round((avgSteps / stepsGoal) * 100)) : 0
  const syncStr = importedAt ? formatSyncTimestamp(importedAt) : null

  return (
    <div className="col-span-1 sm:col-span-2 lg:col-span-12 bg-surface-container border border-outline-variant/10 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant">{labelSteps}</p>
        {syncStr && (
          <span className="text-xs text-on-surface-variant shrink-0">{labelImport}: {syncStr}</span>
        )}
      </div>

      {avgSteps !== undefined ? (
        <>
          <div className="flex items-center gap-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-headline font-bold tracking-tighter leading-none text-on-surface">
                {avgSteps.toLocaleString('de-CH')}
              </span>
              <span className="text-sm text-on-surface-variant">/ {stepsGoal.toLocaleString('de-CH')}</span>
            </div>
            <div className="flex-1">
              <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-movement-400 transition-all duration-700"
                  style={{ width: `${stepsPct}%` }}
                />
              </div>
              <p className="text-xs text-on-surface-variant mt-1">{labelAvg30d} · {stepsPct}%</p>
            </div>
          </div>

          {stepsHistory.length > 1 && (
            <StepsSparkline data={stepsHistory} goal={stepsGoal} />
          )}
        </>
      ) : (
        <p className="text-sm text-on-surface-variant">{labelNoData}</p>
      )}
    </div>
  )
}

// ─── Sweets Tile ──────────────────────────────────────────────────────────

interface SweetsTileProps {
  streak: number
  longestStreak: number
  rate30d: number
  labelSweets: string
  labelDays: string
  labelLongest: string
  labelRate: string
}

function SweetsTile({ streak, longestStreak, rate30d, labelSweets, labelDays, labelLongest, labelRate }: SweetsTileProps) {
  return (
    <div className="col-span-1 sm:col-span-1 lg:col-span-4 bg-surface-container-high border border-outline-variant/10 rounded-xl p-4 flex flex-col gap-3">
      <p className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant">{labelSweets}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-headline font-bold tracking-tighter leading-none text-on-surface">{streak}</span>
        <span className="text-sm text-on-surface-variant">{labelDays}</span>
      </div>
      <div className="space-y-1">
        <div className="h-1 bg-surface-container rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-tertiary transition-all duration-700" style={{ width: `${rate30d}%` }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-on-surface-variant">
            {labelRate}: <span className="text-tertiary font-semibold">{rate30d}%</span>
          </span>
          <span className="text-xs text-on-surface-variant">
            {labelLongest}: <span className="text-on-surface font-semibold">{longestStreak}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Drink Metric Tile ────────────────────────────────────────────────────

interface DrinkMetricTileProps {
  label: string
  avgMl: number
  targetMl: number
  moreIsBetter: boolean
  labelGoal: string
  unit?: string
}

function DrinkMetricTile({ label, avgMl, targetMl, moreIsBetter, labelGoal, unit = 'ml' }: DrinkMetricTileProps) {
  const ratio = targetMl > 0 ? avgMl / targetMl : 0
  const displayPct = Math.round(ratio * 100)
  const barPct = Math.min(100, displayPct)
  const goalMet = moreIsBetter ? avgMl >= targetMl : avgMl <= targetMl
  const barColor = goalMet ? 'bg-movement-400' : moreIsBetter ? 'bg-primary' : 'bg-error'
  const valueColor = goalMet ? 'text-movement-300' : 'text-on-surface'

  const goalDisplay = unit === 'L'
    ? `${(targetMl / 1000).toFixed(1)} L`
    : `${targetMl} ml`

  return (
    <div className="col-span-1 sm:col-span-1 lg:col-span-4 bg-surface-container-high border border-outline-variant/10 rounded-xl p-4 flex flex-col gap-3">
      <p className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-3xl font-headline font-bold tracking-tighter leading-none ${valueColor}`}>
            {(avgMl / 1000).toFixed(1)}
          </span>
          <span className="text-xs text-on-surface-variant">L</span>
        </div>
        <span className="text-xs text-on-surface-variant shrink-0">{labelGoal}: {goalDisplay}</span>
      </div>
      <div className="space-y-1">
        <div className="h-1 bg-surface-container rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColor} transition-all duration-700`} style={{ width: `${barPct}%` }} />
        </div>
        <p className="text-xs text-on-surface-variant text-right">{displayPct}%</p>
      </div>
    </div>
  )
}

// ─── Helper: 7-day vs 30-day success rate ─────────────────────────────────

function computeRates(booleans: boolean[]): { pct30d: number; pct7d: number } {
  const last30 = booleans.slice(0, 30)
  const last7  = booleans.slice(0, 7)
  const pct30d = last30.length > 0 ? Math.round(last30.filter(Boolean).length / last30.length * 100) : 0
  const pct7d  = last7.length  > 0 ? Math.round(last7.filter(Boolean).length  / last7.length  * 100) : 0
  return { pct30d, pct7d }
}

// ─── Live Status Section ───────────────────────────────────────────────────

export async function LiveStatus() {
  const [profile, t] = await Promise.all([
    getProfile(),
    getTranslations('HomePage'),
  ])

  const [entries, metrics, drinkAvg, priorityPillar, stepsHistoryRaw, sweetsHistory] = await Promise.all([
    getAllEntries(),
    getLatestMetrics(profile.projectStartDate ?? undefined),
    getDrinkAvg7d(),
    getPriorityPillar(),
    getStepsHistory(30),
    getSweetsHistory(90),
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

  const sweetsStreak  = calculateSweetsStreak(sweetsHistory)
  const sweetsRate30d = computeSweetsRate30d(sweetsHistory)

  const stepsGoal = profile.targetSteps ?? 10000

  const stepsHistory = stepsHistoryRaw
    .filter((d) => d.steps !== null)
    .map((d) => ({ date: d.date.toISOString().slice(0, 10), steps: d.steps as number }))

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 border-b border-outline-variant/10">

      {/* Section label */}
      <p className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant mb-4">
        {t('metricsSectionTitle')}
      </p>

      {/* Bento grid — 12-col on lg, 2-col on sm, 1-col on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">

        {/* Row A — Habit streaks */}
        <SmokingHeroTile
          streak={smokingStreak.current}
          longestStreak={smokingStreak.longest}
          pct={smokingRates.pct30d}
          labelStreak={t('streakSmoking')}
          labelDays={t('streakDays')}
          labelLongest={t('streakLongest')}
          labelRate={t('rate30d')}
          isPriority={priorityPillar === 'smoking'}
        />
        <HabitStreakTile
          label={t('streakMovement')}
          streak={movementStreak.current}
          longestStreak={movementStreak.longest}
          pct7d={movementRates.pct7d}
          pct30d={movementRates.pct30d}
          colorClass="bg-movement-400"
          colorText="text-movement-300"
          labelDays={t('streakDays')}
          labelRate={t('rate30d')}
          labelLongest={t('streakLongest')}
          labelTrend={t('trend7d')}
          isPriority={priorityPillar === 'movement'}
          pillarKey="movement"
        />
        <HabitStreakTile
          label={t('streakNutrition')}
          streak={nutritionStreak.current}
          longestStreak={nutritionStreak.longest}
          pct7d={nutritionRates.pct7d}
          pct30d={nutritionRates.pct30d}
          colorClass="bg-nutrition-400"
          colorText="text-nutrition-300"
          labelDays={t('streakDays')}
          labelRate={t('rate30d')}
          labelLongest={t('streakLongest')}
          labelTrend={t('trend7d')}
          isPriority={priorityPillar === 'nutrition'}
          pillarKey="nutrition"
        />

        {/* Row B — Weight & Body Fat */}
        <WeightTile
          weight={metrics.latestWeight}
          bmi={metrics.latestBmi}
          targetWeight={profile.targetWeight}
          baselineWeight={metrics.baselineWeight}
          importedAt={metrics.weightImportedAt}
          labelWeight={t('metricWeight')}
          labelBmi={t('metricBmi')}
          labelTarget={t('metricTarget')}
          labelImport={t('metricImport')}
          labelStart={t('metricStart')}
          labelProgress={t('metricProgress')}
          labelNoData={t('metricNoData')}
        />
        <BodyFatTile
          bodyFat={metrics.latestBodyFat}
          baselineBodyFat={metrics.baselineBodyFat}
          importedAt={metrics.bodyFatImportedAt}
          labelBodyFat={t('metricBodyFat')}
          labelTarget={t('metricTarget')}
          labelImport={t('metricImport')}
          labelStart={t('metricStart')}
          labelProgress={t('metricProgress')}
          labelNoData={t('metricNoData')}
        />

        {/* Row C — Steps with sparkline */}
        <StepsTile
          avgSteps={metrics.avgSteps30d}
          stepsGoal={stepsGoal}
          stepsHistory={stepsHistory}
          importedAt={metrics.stepsImportedAt}
          labelSteps={t('metricSteps')}
          labelAvg30d={t('metricAvg30d')}
          labelImport={t('metricImport')}
          labelNoData={t('metricNoData')}
        />

        {/* Row D — Sweets + Drink metrics */}
        <SweetsTile
          streak={sweetsStreak.current}
          longestStreak={sweetsStreak.longest}
          rate30d={sweetsRate30d}
          labelSweets={t('metricSweets')}
          labelDays={t('streakDays')}
          labelLongest={t('streakLongest')}
          labelRate={t('rate30d')}
        />
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

