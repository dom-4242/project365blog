'use client'

import { useRouter } from 'next/navigation'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { HistoryPoint, Calibration } from '@/lib/nutrition/history'

// Kinetic-Lab-Palette (dark-only).
const COLORS = {
  soll: '#767575', // Outline — SOLL (Referenz, gedämpft)
  ist: '#ff8f70', // Primary — IST
  protein: '#fc7c7c', // Secondary
  carbs: '#eaa5ff', // Tertiary
  fat: '#ff8f70', // Primary
  weight: '#adaaaa', // On-Surface-Variant — Rohgewicht
  weightAvg: '#ff8f70', // Primary — gleitender Schnitt
  grid: '#262626',
  axis: '#767575',
}

interface Props {
  points: HistoryPoint[]
  calibration: Calibration
  days: number
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'short',
  })
}

interface TooltipEntry {
  name?: string
  value?: number | null
  color?: string
}

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
  unit: string
}) {
  if (!active || !payload?.length) return null
  const rows = payload.filter((p) => p.value != null)
  if (rows.length === 0) return null
  return (
    <div className="bg-surface-container border border-outline-variant/15 rounded px-3 py-2 text-xs">
      <p className="text-on-surface-variant mb-1">
        {new Date((label ?? '') + 'T00:00:00').toLocaleDateString('de-CH', {
          weekday: 'short',
          day: 'numeric',
          month: 'long',
        })}
      </p>
      {rows.map((p, i) => (
        <p key={i} className="font-semibold tabular-nums" style={{ color: p.color }}>
          {p.name}: {p.value}
          {unit}
        </p>
      ))}
    </div>
  )
}

const RANGES = [14, 30, 90]

const CAL_LABEL: Record<Calibration['tendency'], { text: string; cls: string; hint: string }> = {
  deficit: {
    text: 'Defizit',
    cls: 'bg-primary/15 text-primary border-primary/30',
    hint: 'Gewicht sinkt — du bist im Defizit.',
  },
  maintenance: {
    text: 'Erhalt',
    cls: 'bg-surface-container-high text-on-surface border-outline-variant/30',
    hint: 'Gewicht stabil — Erhaltungsbereich. Für Abnahme kcal senken.',
  },
  surplus: {
    text: 'Überschuss',
    cls: 'bg-error/15 text-error border-error/30',
    hint: 'Gewicht steigt — leichter Überschuss.',
  },
  insufficient_data: {
    text: 'Zu wenig Daten',
    cls: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30',
    hint: 'Für die 14-Tage-Kalibrierung fehlen Gewichtsmessungen.',
  },
}

export function NutritionHistoryCharts({ points, calibration, days }: Props) {
  const router = useRouter()
  const hasKcal = points.some((p) => p.actualKcal != null || p.targetKcal != null)
  const hasWeight = points.some((p) => p.weight != null || p.weightAvg != null)
  const cal = CAL_LABEL[calibration.tendency]

  return (
    <div className="space-y-8">
      {/* Kalibrierungs-Signal */}
      <section className="bg-surface-container rounded-2xl border border-surface-container-high p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h2 className="font-headline text-sm font-semibold text-on-surface">
            14-Tage-Kalibrierung
          </h2>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${cal.cls}`}>
            {cal.text}
          </span>
        </div>
        <p className="text-xs text-on-surface-variant mb-3">{cal.hint}</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <CalStat label="Woche 1 (Ø)" value={calibration.week1Avg} unit="kg" />
          <CalStat label="Woche 2 (Ø)" value={calibration.week2Avg} unit="kg" />
          <CalStat
            label="Δ / Woche"
            value={calibration.deltaKg}
            unit="kg"
            signed
            accent
          />
        </div>
        <p className="text-[10px] text-on-surface-variant mt-2">
          {calibration.daysWithWeight}/14 Tage mit Gewichtsmessung
        </p>
      </section>

      {/* Zeitraum-Wahl */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-on-surface-variant">Zeitraum:</span>
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => router.push(`/admin/nutrition/history?days=${r}`)}
            className={`px-3 py-1 rounded-lg text-xs transition-colors ${
              days === r
                ? 'bg-primary text-on-primary'
                : 'border border-surface-container-high text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {r} Tage
          </button>
        ))}
      </div>

      {/* kcal SOLL vs IST */}
      <ChartCard title="Kalorien — SOLL vs. IST">
        {hasKcal ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="date" tickFormatter={fmtDate} stroke={COLORS.axis} fontSize={11} minTickGap={24} />
              <YAxis stroke={COLORS.axis} fontSize={11} width={44} />
              <Tooltip content={<ChartTooltip unit=" kcal" />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="targetKcal" name="SOLL" stroke={COLORS.soll} strokeDasharray="4 4" dot={false} connectNulls />
              <Line type="monotone" dataKey="actualKcal" name="IST" stroke={COLORS.ist} strokeWidth={2} dot={{ r: 2 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Empty />
        )}
      </ChartCard>

      {/* Makros IST */}
      <ChartCard title="Makronährstoffe — IST (g)">
        {hasKcal ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="date" tickFormatter={fmtDate} stroke={COLORS.axis} fontSize={11} minTickGap={24} />
              <YAxis stroke={COLORS.axis} fontSize={11} width={44} />
              <Tooltip content={<ChartTooltip unit=" g" />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="actualProteinG" name="Protein" stroke={COLORS.protein} strokeWidth={2} dot={false} connectNulls={false} />
              <Line type="monotone" dataKey="actualCarbsG" name="KH" stroke={COLORS.carbs} strokeWidth={2} dot={false} connectNulls={false} />
              <Line type="monotone" dataKey="actualFatG" name="Fett" stroke={COLORS.fat} strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Empty />
        )}
      </ChartCard>

      {/* Gewicht + gleitender Schnitt */}
      <ChartCard title="Gewicht & gleitender 7-Tage-Schnitt">
        {hasWeight ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="date" tickFormatter={fmtDate} stroke={COLORS.axis} fontSize={11} minTickGap={24} />
              <YAxis stroke={COLORS.axis} fontSize={11} width={44} domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip content={<ChartTooltip unit=" kg" />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="weight" name="Messung" stroke={COLORS.weight} strokeWidth={1} dot={{ r: 2 }} connectNulls={false} />
              <Line type="monotone" dataKey="weightAvg" name="Ø 7 Tage" stroke={COLORS.weightAvg} strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Empty text="Noch keine Gewichtsmessungen im Zeitraum (Withings synchronisieren)." />
        )}
      </ChartCard>
    </div>
  )
}

function CalStat({
  label,
  value,
  unit,
  signed,
  accent,
}: {
  label: string
  value: number | null
  unit: string
  signed?: boolean
  accent?: boolean
}) {
  const display =
    value == null ? '–' : `${signed && value > 0 ? '+' : ''}${value}`
  return (
    <div className="rounded-xl bg-surface-container-high py-2">
      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className={`text-sm font-bold tabular-nums ${accent ? 'text-primary' : 'text-on-surface'}`}>
        {display}
        {value != null && <span className="text-[10px] font-normal text-on-surface-variant ml-0.5">{unit}</span>}
      </p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-headline text-sm font-semibold text-on-surface mb-3">{title}</h3>
      <div className="bg-surface-container rounded-2xl border border-surface-container-high p-4">
        {children}
      </div>
    </section>
  )
}

function Empty({ text = 'Noch keine geloggten Tage im Zeitraum.' }: { text?: string }) {
  return <p className="text-sm text-on-surface-variant py-12 text-center">{text}</p>
}
