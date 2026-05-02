'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveMealPlanAction, type MealPlanInput } from '@/app/admin/meal-plan/actions'

type Slot = keyof MealPlanInput

const MEAL_SLOTS: { key: Slot; label: string; required: boolean }[] = [
  { key: 'breakfast',      label: 'Frühstück',               required: true  },
  { key: 'snackMorning',   label: 'Zwischenmahlzeit Morgen',  required: false },
  { key: 'lunch',          label: 'Mittagessen',              required: true  },
  { key: 'snackAfternoon', label: 'Zwischenmahlzeit Nachm.',  required: false },
  { key: 'dinner',         label: 'Abendessen',               required: true  },
  { key: 'snack',          label: 'Snack (Bonus)',            required: false },
]

function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`)
  return d.toLocaleDateString('de-CH', {
    timeZone: 'Europe/Zurich',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

interface MealPlanFormProps {
  dateStr: string
  initial: MealPlanInput | null
  suggestions: Record<Slot, string[]>
}

export function MealPlanForm({ dateStr, initial, suggestions }: MealPlanFormProps) {
  const router = useRouter()
  const [values, setValues] = useState<MealPlanInput>({
    breakfast:      initial?.breakfast      ?? '',
    snackMorning:   initial?.snackMorning   ?? '',
    lunch:          initial?.lunch          ?? '',
    snackAfternoon: initial?.snackAfternoon ?? '',
    dinner:         initial?.dinner         ?? '',
    snack:          initial?.snack          ?? '',
  })
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function navigate(offset: number) {
    router.push(`/admin/meal-plan?date=${addDays(dateStr, offset)}`)
  }

  function handleSave() {
    startTransition(async () => {
      await saveMealPlanAction(dateStr, values)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="bg-surface-container rounded-xl border border-outline-variant/15 overflow-hidden">
      {/* Date navigator */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          aria-label="Vorheriger Tag"
        >
          ←
        </button>
        <div className="text-center">
          <p className="text-sm font-headline font-bold text-on-surface">{formatDateLabel(dateStr)}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(1)}
          className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          aria-label="Nächster Tag"
        >
          →
        </button>
      </div>

      {/* Meal inputs */}
      <div className="px-5 divide-y divide-outline-variant/10">
        {MEAL_SLOTS.map(({ key, label, required }) => (
          <div key={key} className="py-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <label htmlFor={`slot-${key}`} className="text-sm text-on-surface">
                {label}
              </label>
              {!required && (
                <span className="text-[10px] font-label font-bold tracking-widest uppercase text-primary">
                  Optional
                </span>
              )}
            </div>
            <input
              id={`slot-${key}`}
              type="text"
              list={`suggestions-${key}`}
              value={values[key] ?? ''}
              onChange={(e) => {
                setSaved(false)
                setValues((prev) => ({ ...prev, [key]: e.target.value }))
              }}
              placeholder={required ? label : `${label} (optional)`}
              className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
            <datalist id={`suggestions-${key}`}>
              {suggestions[key].map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
        ))}
      </div>

      {/* Save */}
      <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-outline-variant/10">
        {saved && <span className="text-xs text-green-400">Gespeichert ✓</span>}
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-[#0e0e0e] hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Speichern…' : 'Plan speichern'}
        </button>
      </div>
    </div>
  )
}
