'use client'

import { useState, useTransition } from 'react'
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
  if (score >= 4.0) return 'text-green-400'
  if (score >= 2.5) return 'text-yellow-400'
  return 'text-red-400'
}

function scoreBarColor(score: number): string {
  if (score >= 4.0) return 'bg-green-500'
  if (score >= 2.5) return 'bg-yellow-500'
  return 'bg-red-500'
}

interface MealRowProps {
  label: string
  required: boolean
  value: number | null
  onChange: (v: number | null) => void
}

function MealRow({ label, required, value, onChange }: MealRowProps) {
  const isSkipped = value === null

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
        onClick={() => onChange(isSkipped ? 3 : null)}
        className={`shrink-0 text-xs font-label font-bold tracking-widest uppercase px-2.5 py-1 rounded border transition-colors ${
          isSkipped
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/40'
        }`}
      >
        {isSkipped ? '✕ Nicht' : '✕'}
      </button>

      {!isSkipped && (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`w-8 h-8 rounded text-xs font-bold transition-colors ${
                value === n
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {isSkipped && <div className="flex-1" />}
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
  const barPct = (score / 5) * 100

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
              {score.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Meal rows */}
      <div className="px-5">
        {MEAL_SLOTS.map(({ key, label, required }) => (
          <MealRow
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
