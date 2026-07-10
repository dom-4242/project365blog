'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  computeEckdaten,
  type EckdatenInput,
  type Sex,
  type PhaseMode,
  type DeficitMethod,
} from '@/lib/nutrition/calc'
import {
  createPhase,
  addTargetsVersion,
  type EckdatenFormData,
} from '@/app/admin/nutrition/actions'

export interface NutritionPhaseFormInitial {
  weightKg: string
  heightCm: string
  age: string
  sex: Sex
  bodyFatPct: string
  activityFactor: string
  phaseMode: PhaseMode
  deficitMethod: DeficitMethod
  validFrom: string
}

const ACTIVITY_FACTORS = [
  { value: '1.2', label: '1,2 — sesshaft' },
  { value: '1.375', label: '1,375 — wenig aktiv' },
  { value: '1.55', label: '1,55 — moderat' },
  { value: '1.725', label: '1,725 — sehr hoch' },
  { value: '1.9', label: '1,9 — extrem' },
]

function toNum(s: string): number | null {
  if (!s.trim()) return null
  const n = parseFloat(s.replace(',', '.'))
  return isNaN(n) ? null : n
}

function Field({
  label,
  unit,
  value,
  onChange,
  step = 'any',
  placeholder = '—',
}: {
  label: string
  unit?: string
  value: string
  onChange: (v: string) => void
  step?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-on-surface-variant mb-1">
        {label} {unit && <span className="font-normal">({unit})</span>}
      </label>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-surface-container-high rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-on-surface-variant bg-surface-container"
      />
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-on-surface-variant mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-surface-container-high rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-on-surface-variant bg-surface-container"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function PreviewRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="text-xs text-on-surface-variant">{label}</span>
      <span className="text-sm font-medium text-on-surface tabular-nums">
        {value} {sub && <span className="text-on-surface-variant font-normal">{sub}</span>}
      </span>
    </div>
  )
}

export function NutritionPhaseForm({ initial }: { initial: NutritionPhaseFormInitial }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [weightKg, setWeightKg] = useState(initial.weightKg)
  const [heightCm, setHeightCm] = useState(initial.heightCm)
  const [age, setAge] = useState(initial.age)
  const [sex, setSex] = useState<Sex>(initial.sex)
  const [bodyFatPct, setBodyFatPct] = useState(initial.bodyFatPct)
  const [activityFactor, setActivityFactor] = useState(initial.activityFactor)
  const [phaseMode, setPhaseMode] = useState<PhaseMode>(initial.phaseMode)
  const [deficitMethod, setDeficitMethod] = useState<DeficitMethod>(initial.deficitMethod)
  const [validFrom, setValidFrom] = useState(initial.validFrom)
  const [note, setNote] = useState('')

  // Live-Vorschau: gleiche reine Rechenlogik wie serverseitig
  const preview = useMemo(() => {
    const w = toNum(weightKg)
    const h = toNum(heightCm)
    const a = toNum(age)
    const af = toNum(activityFactor)
    if (w === null || h === null || a === null || af === null || w <= 0 || h <= 0 || a <= 0) {
      return null
    }
    const input: EckdatenInput = {
      weightKg: w,
      heightCm: h,
      age: a,
      sex,
      bodyFatPct: toNum(bodyFatPct),
      activityFactor: af,
      phaseMode,
      deficitMethod,
    }
    return computeEckdaten(input)
  }, [weightKg, heightCm, age, sex, bodyFatPct, activityFactor, phaseMode, deficitMethod])

  function buildData(): EckdatenFormData {
    return {
      weightKg,
      heightCm,
      age,
      sex,
      bodyFatPct,
      activityFactor,
      phaseMode,
      deficitMethod,
      validFrom,
      note,
    }
  }

  function run(
    action: (d: EckdatenFormData) => Promise<{ error?: string; success?: boolean }>,
    okMsg: string,
  ) {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await action(buildData())
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(okMsg)
        router.refresh()
      }
    })
  }

  const isDeficit = phaseMode === 'DEFICIT'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Eingaben */}
      <div className="bg-surface-container rounded-2xl border border-surface-container-high p-5 space-y-4">
        <h3 className="font-headline text-sm font-semibold text-on-surface">Eingaben</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Gewicht" unit="kg" value={weightKg} onChange={setWeightKg} step="0.1" />
          <Field label="Grösse" unit="cm" value={heightCm} onChange={setHeightCm} step="0.5" />
          <Field label="Alter" unit="J." value={age} onChange={setAge} step="1" />
          <Field label="Körperfett" unit="%" value={bodyFatPct} onChange={setBodyFatPct} step="0.1" />
          <Select
            label="Geschlecht"
            value={sex}
            onChange={(v) => setSex(v as Sex)}
            options={[
              { value: 'MALE', label: '♂ männlich' },
              { value: 'FEMALE', label: '♀ weiblich' },
            ]}
          />
          <Select
            label="Aktivitätsfaktor"
            value={activityFactor}
            onChange={setActivityFactor}
            options={ACTIVITY_FACTORS}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Phasen-Modus"
            value={phaseMode}
            onChange={(v) => setPhaseMode(v as PhaseMode)}
            options={[
              { value: 'DEFICIT', label: 'Defizit' },
              { value: 'MAINTENANCE', label: 'Erhalt' },
              { value: 'SURPLUS', label: 'Leichter Überschuss' },
            ]}
          />
          <Select
            label="Defizit-Methode"
            value={deficitMethod}
            onChange={(v) => setDeficitMethod(v as DeficitMethod)}
            options={[
              { value: 'MODERATE', label: 'Moderat (× 0,8)' },
              { value: 'AGGRESSIVE', label: 'Aggressiv (× 0,7)' },
              { value: 'SIMPLE', label: 'Einfach (− 500)' },
            ]}
          />
        </div>
        {!isDeficit && (
          <p className="text-xs text-on-surface-variant">
            Defizit-Methode wird bei Erhalt/Überschuss ignoriert.
          </p>
        )}

        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">
            Gültig ab / Phasenstart
          </label>
          <input
            type="date"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            className="border border-surface-container-high rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-on-surface-variant bg-surface-container"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">
            Notiz (optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="z. B. Diätblock 1"
            className="w-full border border-surface-container-high rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-on-surface-variant bg-surface-container"
          />
        </div>
      </div>

      {/* Vorschau + Aktionen */}
      <div className="bg-surface-container rounded-2xl border border-surface-container-high p-5 space-y-4">
        <h3 className="font-headline text-sm font-semibold text-on-surface">
          Errechnete Eckdaten (Vorschau)
        </h3>

        {preview ? (
          <div className="space-y-3">
            <div className="rounded-xl bg-surface-container-high p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-widest text-on-surface-variant">
                  Ziel-Kalorien
                </span>
                <span className="font-headline text-2xl font-bold text-primary tabular-nums">
                  {preview.targetKcal}
                  <span className="text-sm font-normal text-on-surface-variant"> kcal</span>
                </span>
              </div>
            </div>

            <div className="divide-y divide-surface-container-high">
              <PreviewRow label="Protein" value={`${preview.proteinG} g`} sub={`· ${preview.proteinG * 4} kcal`} />
              <PreviewRow label="Fett" value={`${preview.fatG} g`} sub={`· ${preview.fatG * 9} kcal`} />
              <PreviewRow label="Kohlenhydrate" value={`${preview.carbsG} g`} sub={`· ${preview.carbsG * 4} kcal`} />
              <PreviewRow label="Mahlzeiten / Tag" value={`${preview.mealsPerDay}`} />
            </div>

            <div className="pt-1 divide-y divide-surface-container-high text-on-surface-variant">
              <PreviewRow label="BMR Ø (HB #1 / #2)" value={`${preview.bmrAvg}`} sub={`(${preview.bmr1} / ${preview.bmr2})`} />
              <PreviewRow label="Erhaltungskalorien (TDEE)" value={`${preview.tdee} kcal`} />
              <PreviewRow
                label="Protein-Bezug"
                value={`${preview.proteinReferenceKg} kg`}
                sub={preview.highBodyFatCorrection ? '(FFM, KF-Korrektur)' : '(Körpergewicht)'}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">
            Gewicht, Grösse, Alter und Aktivitätsfaktor eingeben für die Vorschau.
          </p>
        )}

        {error && (
          <div className="p-3 bg-error/10 border border-error/30 rounded-lg text-sm text-error">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg text-sm text-primary">
            {success}
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            disabled={isPending || !preview}
            onClick={() => run(createPhase, 'Neue Phase angelegt.')}
            className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Speichern…' : 'Neue Phase anlegen'}
          </button>
          <button
            type="button"
            disabled={isPending || !preview}
            onClick={() =>
              run(addTargetsVersion, 'Eckdaten-Version gespeichert (aktive Phase).')
            }
            className="px-6 py-2.5 border border-surface-container-high text-on-surface rounded-xl text-sm font-medium hover:border-outline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Eckdaten neu berechnen (Version für aktive Phase)
          </button>
        </div>
      </div>
    </div>
  )
}
