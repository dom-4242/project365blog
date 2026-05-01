'use client'

import { useState, useTransition, useRef } from 'react'
import { calculateMealScore, type MealInput, type MealLogData } from '@/lib/meal-log'
import { saveMealLogAction } from '@/app/admin/quick-log/meal-actions'

const MEAL_SLOTS: { key: keyof MealInput; label: string; required: boolean }[] = [
  { key: 'breakfast',      label: 'Frühstück',              required: true  },
  { key: 'snackMorning',   label: 'Zwischenmahlzeit Morgen', required: true  },
  { key: 'lunch',          label: 'Mittagessen',             required: true  },
  { key: 'snackAfternoon', label: 'Zwischenmahlzeit Nachm.', required: true  },
  { key: 'dinner',         label: 'Abendessen',              required: true  },
  { key: 'snack',          label: 'Snack (Bonus)',           required: false },
]

function scoreColor(score: number): string {
  if (score >= 8.0) return 'text-green-400'
  if (score >= 5.0) return 'text-yellow-400'
  return 'text-red-400'
}

function scoreBarColor(score: number): string {
  if (score >= 8.0) return 'bg-green-500'
  if (score >= 5.0) return 'bg-yellow-500'
  return 'bg-red-500'
}

interface MealSliderProps {
  label: string
  required: boolean
  value: number | null
  onChange: (v: number | null) => void
}

function MealSlider({ label, required, value, onChange }: MealSliderProps) {
  const isSkipped = value === null
  // pct from 0 to 100 representing where on the 1–10 track the thumb sits
  const pct = value !== null ? ((value - 1) / 9) * 100 : 0

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-outline-variant/10 last:border-0">
      <div className="w-36 shrink-0">
        <span className="text-sm text-on-surface">{label}</span>
        {!required && (
          <span className="ml-1.5 text-[10px] font-label font-bold tracking-widest uppercase text-primary">Bonus</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => onChange(isSkipped ? 5 : null)}
        className={`shrink-0 text-xs font-label font-bold tracking-widest uppercase px-2.5 py-1 rounded border transition-colors ${
          isSkipped
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/40'
        }`}
      >
        {isSkipped ? '✕ Nicht' : '✕'}
      </button>

      {!isSkipped ? (
        <div className="relative flex-1 h-8 flex items-center">
          {/* Gradient track */}
          <div
            className="absolute inset-x-0 h-2 rounded-full"
            style={{
              background: 'linear-gradient(to right, #ef4444 0%, #eab308 45%, #22c55e 100%)',
            }}
          />
          {/* Thumb indicator (purely visual) */}
          <div
            className="absolute w-4 h-4 rounded-full bg-white shadow-md border-2 border-white/80 pointer-events-none"
            style={{ left: `calc(${pct}% - 8px)` }}
          />
          {/* Native range input (transparent, captures events) */}
          <input
            type="range"
            min={1}
            max={10}
            step={0.1}
            value={value ?? 5}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  )
}

interface MealLogFormProps {
  dateStr: string
  initial: MealLogData | null
}

export function MealLogForm({ dateStr, initial }: MealLogFormProps) {
  const [values, setValues] = useState<MealInput>({
    breakfast:      initial?.breakfast      ?? null,
    snackMorning:   initial?.snackMorning   ?? null,
    lunch:          initial?.lunch          ?? null,
    snackAfternoon: initial?.snackAfternoon ?? null,
    dinner:         initial?.dinner         ?? null,
    snack:          initial?.snack          ?? null,
  })
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const score = calculateMealScore(values)
  const barPct = (score / 10) * 100

  function setMeal(key: keyof MealInput, val: number | null) {
    setValues((prev) => ({ ...prev, [key]: val }))
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      await saveMealLogAction(dateStr, values)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <div className="bg-surface-container rounded-xl border border-outline-variant/15 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/10">
        <h3 className="text-sm font-headline font-bold text-on-surface">Mahlzeiten</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${scoreBarColor(score)}`}
                style={{ width: `${barPct}%` }}
              />
            </div>
            <span className={`text-sm font-bold tabular-nums ${scoreColor(score)}`}>
              {score.toFixed(1)}<span className="text-xs font-normal text-on-surface-variant ml-0.5">/10</span>
            </span>
          </div>
        </div>
      </div>

      {/* Meal rows */}
      <div className="px-5">
        {MEAL_SLOTS.map(({ key, label, required }) => (
          <MealSlider
            key={key}
            label={label}
            required={required}
            value={values[key]}
            onChange={(v) => setMeal(key, v)}
          />
        ))}
      </div>

      {/* Save */}
      <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-outline-variant/10">
        {saved && <span className="text-xs text-green-400">Gespeichert ✓</span>}
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-nutrition-600 text-white hover:bg-nutrition-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Speichern…' : 'Mahlzeiten speichern'}
        </button>
      </div>
    </div>
  )
}
