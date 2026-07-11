import { getTranslations, getLocale } from 'next-intl/server'
import { getAllEntries } from '@/lib/journal'
import { getLatestMetrics, getStepsHistory } from '@/lib/metrics'
import { getProfile } from '@/lib/profile'
import { getPriorityPillar, getPublicSollIst } from '@/lib/settings'
import { getPublicKcalWeek } from '@/lib/nutrition/public-week'
import {
  calculateSweetsStreak,
  computeSweetsRate30d,
  isMovementFulfilled,
  nutritionOutcome,
  isSmokingFulfilled,
} from '@/lib/habits'
import {
  getDrinkAnalytics,
  getSweetsHistory,
  WATER_DAILY_TARGET_ML,
  COLA_ZERO_DAILY_LIMIT_ML,
  type DrinkDayData,
} from '@/lib/drinks'
import { StepsSparkline } from './StepsSparkline'
import { DrinkSparkline } from './DrinkSparkline'
import { CaloriesWeekTile } from './CaloriesWeekTile'

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

// ─── Pillar Donut Tile (Rauchstopp / Bewegung / Ernährung) ────────────────

interface PillarDonutTileProps {
  label: string
  pct: number
  colorText: string
  colorAccent: string
  strokeClass: string
  labelAchieved: string
  outOfDaysText: string
  last30Text?: string
  isPriority?: boolean
  pillarKey?: string
}

function PillarDonutTile({
  label, pct,
  colorText, colorAccent, strokeClass,
  labelAchieved, outOfDaysText, last30Text,
  isPriority, pillarKey,
}: PillarDonutTileProps) {
  const glow = isPriority && pillarKey ? PILLAR_GLOW[pillarKey] : null

  // Donut geometry
  const size = 132
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = (pct / 100) * c

  return (
    <div
      className={`relative col-span-1 sm:col-span-1 lg:col-span-4 bg-surface-variant/40 backdrop-blur-xl rounded-xl p-5 overflow-hidden flex flex-col gap-4 transition-shadow ${glow ? `border ${glow.border}` : 'border border-outline-variant/15'}`}
      style={glow ? { boxShadow: glow.shadow } : undefined}
      role={isPriority ? 'region' : undefined}
      aria-label={isPriority && pillarKey ? `Priorität: ${label}` : undefined}
    >
      {isPriority && <span className="sr-only">Aktueller Fokus</span>}
      <p className={`text-xs font-label font-bold tracking-widest uppercase ${colorAccent}`}>{label}</p>

      <div className="flex items-center justify-center flex-1">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-surface-container-high" />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c - dash}`}
              className={`${strokeClass} transition-[stroke-dasharray] duration-700`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-headline font-bold tracking-tighter leading-none ${colorText}`}>
              {pct}%
            </span>
            <span className="text-[10px] font-label font-bold tracking-widest uppercase text-on-surface-variant mt-1">
              {labelAchieved}
            </span>
          </div>
        </div>
      </div>

      <div className="text-center space-y-0.5">
        <p className="text-xs text-on-surface-variant">{outOfDaysText}</p>
        {last30Text && (
          <p className="text-[11px] text-on-surface-variant/70">{last30Text}</p>
        )}
      </div>
    </div>
  )
}

// ─── Trend Badge ──────────────────────────────────────────────────────────

function TrendBadge({ current, baseline, unit, threshold = 0.05 }: { current: number; baseline: number; unit: string; threshold?: number }) {
  const delta = current - baseline
  if (Math.abs(delta) < threshold) return null
  const isGood = delta < 0
  const sign = delta < 0 ? '−' : '+'
  const arrow = delta < 0 ? '↓' : '↑'
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
      isGood ? 'text-movement-400' : 'text-secondary'
    }`}>
      {arrow} {sign}{Math.abs(delta).toFixed(1)}{unit}
    </span>
  )
}

// ─── Weight Progress Tile ──────────────────────────────────────────────────

interface WeightTileProps {
  weight?: number
  weightAvg7d?: number
  weightAvg7dPrev?: number
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
  labelAvg7d: string
  labelToday: string
  labelNoData: string
}

function WeightTile({ weight, weightAvg7d, weightAvg7dPrev, bmi, targetWeight, baselineWeight, importedAt, labelWeight, labelBmi, labelTarget, labelImport, labelStart, labelProgress, labelAvg7d, labelToday, labelNoData }: WeightTileProps) {
  const display = weightAvg7d ?? weight
  const hasDisplay = display !== undefined
  const hasTarget = targetWeight !== null && targetWeight !== undefined
  const hasBaseline = baselineWeight !== undefined
  const showingAvg = weightAvg7d !== undefined

  let pct = 0
  if (hasDisplay && hasTarget && hasBaseline) {
    const totalNeeded = baselineWeight! - targetWeight!
    const achieved = baselineWeight! - display!
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

      {hasDisplay ? (
        <>
          <div className="flex items-end gap-6">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-headline font-bold tracking-tighter leading-none text-on-surface">
                  {display!.toFixed(1)}
                </span>
                <span className="text-sm text-on-surface-variant">kg</span>
                {showingAvg && weightAvg7dPrev !== undefined && (
                  <TrendBadge current={weightAvg7d!} baseline={weightAvg7dPrev} unit=" kg" threshold={0.1} />
                )}
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                {showingAvg ? (
                  <>
                    <span className="font-semibold text-on-surface">{labelAvg7d}</span>
                    {weight !== undefined && (
                      <> · {labelToday}: <span className="text-on-surface font-semibold">{weight.toFixed(1)} kg</span></>
                    )}
                    {bmi && (
                      <> · {labelBmi}: <span className="text-on-surface font-semibold">{bmi}</span></>
                    )}
                  </>
                ) : (
                  bmi && <>{labelBmi}: <span className="text-on-surface font-semibold">{bmi}</span></>
                )}
              </p>
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
  bodyFatAvg7d?: number
  bodyFatAvg7dPrev?: number
  baselineBodyFat?: number
  importedAt?: Date
  labelBodyFat: string
  labelTarget: string
  labelImport: string
  labelStart: string
  labelProgress: string
  labelAvg7d: string
  labelToday: string
  labelNoData: string
}

function BodyFatTile({ bodyFat, bodyFatAvg7d, bodyFatAvg7dPrev, baselineBodyFat, importedAt, labelBodyFat, labelTarget, labelImport, labelStart, labelProgress, labelAvg7d, labelToday, labelNoData }: BodyFatTileProps) {
  const display = bodyFatAvg7d ?? bodyFat
  const hasDisplay = display !== undefined
  const hasBaseline = baselineBodyFat !== undefined
  const showingAvg = bodyFatAvg7d !== undefined

  let pct = 0
  if (hasDisplay && hasBaseline) {
    const totalNeeded = baselineBodyFat! - TARGET_BODY_FAT_PCT
    const achieved = baselineBodyFat! - display!
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

      {hasDisplay ? (
        <>
          <div className="flex items-end gap-6">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-headline font-bold tracking-tighter leading-none text-on-surface">
                  {display!.toFixed(1)}
                </span>
                <span className="text-sm text-on-surface-variant">%</span>
                {showingAvg && bodyFatAvg7dPrev !== undefined && (
                  <TrendBadge current={bodyFatAvg7d!} baseline={bodyFatAvg7dPrev} unit="%" threshold={0.1} />
                )}
              </div>
              {showingAvg && (
                <p className="text-xs text-on-surface-variant mt-1">
                  <span className="font-semibold text-on-surface">{labelAvg7d}</span>
                  {bodyFat !== undefined && (
                    <> · {labelToday}: <span className="text-on-surface font-semibold">{bodyFat.toFixed(1)} %</span></>
                  )}
                </p>
              )}
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
  /** Grid-Breite: volle Breite, oder halb wenn die Kalorien-Kachel daneben steht. */
  spanClass?: string
}

function StepsTile({ avgSteps, stepsGoal, stepsHistory, importedAt, labelSteps, labelAvg30d, labelImport, labelNoData, spanClass = 'sm:col-span-2 lg:col-span-12' }: StepsTileProps) {
  const stepsPct = avgSteps ? Math.min(100, Math.round((avgSteps / stepsGoal) * 100)) : 0
  const syncStr = importedAt ? formatSyncTimestamp(importedAt) : null

  return (
    <div className={`col-span-1 ${spanClass} bg-surface-container border border-outline-variant/10 rounded-xl p-5 flex flex-col gap-4`}>
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
  history: DrinkDayData[]
  dataKey: 'waterMl' | 'colaZeroMl'
}

function DrinkMetricTile({ label, avgMl, targetMl, moreIsBetter, labelGoal, history, dataKey }: DrinkMetricTileProps) {
  const ratio = targetMl > 0 ? avgMl / targetMl : 0
  const displayPct = Math.round(ratio * 100)
  const barPct = Math.min(100, displayPct)
  const goalMet = moreIsBetter ? avgMl >= targetMl : avgMl <= targetMl
  const barColor = goalMet ? 'bg-movement-400' : moreIsBetter ? 'bg-primary' : 'bg-error'
  const valueColor = goalMet ? 'text-movement-300' : 'text-on-surface'

  const goalDisplay = `${(targetMl / 1000).toFixed(1)} L`
  const sparkData = history.map((d) => ({ date: d.date, ml: d[dataKey] }))

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
      {sparkData.length > 1 && (
        <DrinkSparkline data={sparkData} targetMl={targetMl} moreIsBetter={moreIsBetter} />
      )}
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

  const [entries, metrics, drinkAnalytics, priorityPillar, stepsHistoryRaw, sweetsHistory, showKcal, locale] = await Promise.all([
    getAllEntries(),
    getLatestMetrics(profile.projectStartDate ?? undefined),
    getDrinkAnalytics(7),
    getPriorityPillar(),
    getStepsHistory(30),
    getSweetsHistory(90),
    getPublicSollIst(),
    getLocale(),
  ])

  // Öffentliche kcal-Woche nur laden, wenn der N-11-Schalter aktiv ist (Privacy).
  const kcalWeek = showKcal ? await getPublicKcalWeek() : null

  const movementBools  = entries.map((e) => isMovementFulfilled(e.habits.movement))
  const smokingBools   = entries.map((e) => isSmokingFulfilled(e.habits.smoking))
  // Ernährung: neutrale/offene Tage (kein Food-Logging) fliegen ganz raus.
  const nutritionBools = entries
    .map((e) => nutritionOutcome(e.habits.nutrition, e.nutritionStatus))
    .filter((v): v is boolean => v !== null)

  const totalEntries = entries.length
  const nutritionTotal = nutritionBools.length
  const movementFulfilled  = movementBools.filter(Boolean).length
  const nutritionFulfilled = nutritionBools.filter(Boolean).length
  const smokingFulfilled   = smokingBools.filter(Boolean).length

  const movementOverallPct  = totalEntries > 0 ? Math.round(movementFulfilled  / totalEntries * 100) : 0
  const nutritionOverallPct = nutritionTotal > 0 ? Math.round(nutritionFulfilled / nutritionTotal * 100) : 0
  const smokingOverallPct   = totalEntries > 0 ? Math.round(smokingFulfilled   / totalEntries * 100) : 0

  const movementRates  = computeRates(movementBools)
  const nutritionRates = computeRates(nutritionBools)
  const smokingRates   = computeRates(smokingBools)

  const recent30Total = Math.min(30, totalEntries)
  const nutritionRecent30Total = Math.min(30, nutritionTotal)

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

        {/* Row A — Pillar achievement donuts */}
        <PillarDonutTile
          label={t('streakSmoking')}
          pct={smokingOverallPct}
          colorText="text-smoking-300"
          colorAccent="text-smoking-400"
          strokeClass="stroke-smoking-400"
          labelAchieved={t('pillarAchieved')}
          outOfDaysText={t('pillarOutOfDays', { fulfilled: smokingFulfilled, total: totalEntries })}
          last30Text={recent30Total > 0 ? t('pillarLast30', { pct: smokingRates.pct30d }) : undefined}
          isPriority={priorityPillar === 'smoking'}
          pillarKey="smoking"
        />
        <PillarDonutTile
          label={t('streakMovement')}
          pct={movementOverallPct}
          colorText="text-movement-300"
          colorAccent="text-movement-400"
          strokeClass="stroke-movement-400"
          labelAchieved={t('pillarAchieved')}
          outOfDaysText={t('pillarOutOfDays', { fulfilled: movementFulfilled, total: totalEntries })}
          last30Text={recent30Total > 0 ? t('pillarLast30', { pct: movementRates.pct30d }) : undefined}
          isPriority={priorityPillar === 'movement'}
          pillarKey="movement"
        />
        <PillarDonutTile
          label={t('streakNutrition')}
          pct={nutritionOverallPct}
          colorText="text-nutrition-300"
          colorAccent="text-nutrition-400"
          strokeClass="stroke-nutrition-400"
          labelAchieved={t('pillarAchieved')}
          outOfDaysText={t('pillarOutOfDays', { fulfilled: nutritionFulfilled, total: nutritionTotal })}
          last30Text={nutritionRecent30Total > 0 ? t('pillarLast30', { pct: nutritionRates.pct30d }) : undefined}
          isPriority={priorityPillar === 'nutrition'}
          pillarKey="nutrition"
        />

        {/* Row C — Weight & Body Fat */}
        <WeightTile
          weight={metrics.latestWeight}
          weightAvg7d={metrics.weightAvg7d}
          weightAvg7dPrev={metrics.weightAvg7dPrev}
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
          labelAvg7d={t('metricAvg7d')}
          labelToday={t('metricToday')}
          labelNoData={t('metricNoData')}
        />
        <BodyFatTile
          bodyFat={metrics.latestBodyFat}
          bodyFatAvg7d={metrics.bodyFatAvg7d}
          bodyFatAvg7dPrev={metrics.bodyFatAvg7dPrev}
          baselineBodyFat={metrics.baselineBodyFat}
          importedAt={metrics.bodyFatImportedAt}
          labelBodyFat={t('metricBodyFat')}
          labelTarget={t('metricTarget')}
          labelImport={t('metricImport')}
          labelStart={t('metricStart')}
          labelProgress={t('metricProgress')}
          labelAvg7d={t('metricAvg7d')}
          labelToday={t('metricToday')}
          labelNoData={t('metricNoData')}
        />

        {/* Row D — Steps with sparkline (half width when the calories tile is shown) */}
        <StepsTile
          avgSteps={metrics.avgSteps30d}
          stepsGoal={stepsGoal}
          stepsHistory={stepsHistory}
          importedAt={metrics.stepsImportedAt}
          labelSteps={t('metricSteps')}
          labelAvg30d={t('metricAvg30d')}
          labelImport={t('metricImport')}
          labelNoData={t('metricNoData')}
          spanClass={kcalWeek ? 'sm:col-span-1 lg:col-span-6' : 'sm:col-span-2 lg:col-span-12'}
        />

        {/* Row D — Calories 7-day (public, gated by the N-11 toggle) */}
        {kcalWeek && (
          <CaloriesWeekTile
            data={kcalWeek}
            locale={locale}
            labels={{
              title: t('metricCalories7d'),
              target: t('metricTarget'),
              noData: t('metricNoData'),
              phaseDeficit: t('phaseDeficit'),
              phaseMaintenance: t('phaseMaintenance'),
              phaseSurplus: t('phaseSurplus'),
            }}
          />
        )}

        {/* Row E — Sweets + Drink metrics */}
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
          avgMl={drinkAnalytics.waterStats.avg}
          targetMl={WATER_DAILY_TARGET_ML}
          moreIsBetter={true}
          labelGoal={t('metricDailyGoal')}
          history={drinkAnalytics.days}
          dataKey="waterMl"
        />
        <DrinkMetricTile
          label={t('metricColaZero')}
          avgMl={drinkAnalytics.colaStats.avg}
          targetMl={COLA_ZERO_DAILY_LIMIT_ML}
          moreIsBetter={false}
          labelGoal={t('metricDailyLimit')}
          history={drinkAnalytics.days}
          dataKey="colaZeroMl"
        />

      </div>
    </section>
  )
}

