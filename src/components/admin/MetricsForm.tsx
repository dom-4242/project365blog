'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { upsertMetrics, type MetricsFormData } from '@/app/admin/metrics/actions'

interface MetricsFormProps {
  date: string
  initial?: Partial<MetricsFormData>
}

interface FieldProps {
  label: string
  unit: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  step?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}

function MetricField({ label, unit, value, onChange, placeholder = '—', step = 'any', inputMode = 'decimal' }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-sand-500 mb-1">
        {label} <span className="font-normal text-sand-400">({unit})</span>
      </label>
      <input
        type="number"
        inputMode={inputMode}
        step={step}
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-ctp-surface1 rounded-lg px-3 py-1.5 text-sm text-ctp-text focus:outline-none focus:border-sand-400 bg-ctp-surface0"
      />
    </div>
  )
}

export function MetricsForm({ date, initial }: MetricsFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [weight, setWeight] = useState(initial?.weight ?? '')
  const [bodyFat, setBodyFat] = useState(initial?.bodyFat ?? '')
  const [bmi, setBmi] = useState(initial?.bmi ?? '')
  const [steps, setSteps] = useState(initial?.steps ?? '')
  const [activeMinutes, setActiveMinutes] = useState(initial?.activeMinutes ?? '')
  const [caloriesBurned, setCaloriesBurned] = useState(initial?.caloriesBurned ?? '')
  const [distance, setDistance] = useState(initial?.distance ?? '')
  const [restingHR, setRestingHR] = useState(initial?.restingHR ?? '')
  const [sleepDuration, setSleepDuration] = useState(initial?.sleepDuration ?? '')

  function handleDateChange(value: string) {
    router.push(`/admin/metrics?date=${value}`)
  }

  function prevDay() {
    const d = new Date(date)
    d.setDate(d.getDate() - 1)
    router.push(`/admin/metrics?date=${d.toISOString().slice(0, 10)}`)
  }

  function nextDay() {
    const d = new Date(date)
    d.setDate(d.getDate() + 1)
    router.push(`/admin/metrics?date=${d.toISOString().slice(0, 10)}`)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const data: MetricsFormData = {
      date, weight, bodyFat, bmi, steps, activeMinutes, caloriesBurned,
      distance, restingHR, sleepDuration,
    }

    startTransition(async () => {
      const result = await upsertMetrics(data)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Datum-Navigation */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={prevDay}
          className="p-1.5 rounded-lg border border-ctp-surface1 text-sand-500 hover:text-ctp-text hover:border-sand-300 transition-colors"
          aria-label="Vorheriger Tag"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <input
          type="date"
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          className="border border-ctp-surface1 rounded-lg px-3 py-1.5 text-sm text-ctp-text focus:outline-none focus:border-sand-400 bg-ctp-surface0"
        />
        <button
          type="button"
          onClick={nextDay}
          className="p-1.5 rounded-lg border border-ctp-surface1 text-sand-500 hover:text-ctp-text hover:border-sand-300 transition-colors"
          aria-label="Nächster Tag"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Körperwerte */}
      <div className="bg-ctp-base rounded-2xl border border-ctp-surface1 p-5">
        <h3 className="font-display text-sm font-semibold text-ctp-text mb-4">Körperwerte</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricField label="Gewicht" unit="kg" value={weight} onChange={setWeight} step="0.1" />
          <MetricField label="Körperfett" unit="%" value={bodyFat} onChange={setBodyFat} step="0.1" />
          <MetricField label="BMI" unit="kg/m²" value={bmi} onChange={setBmi} step="0.1" />
        </div>
      </div>

      {/* Aktivität */}
      <div className="bg-ctp-base rounded-2xl border border-ctp-surface1 p-5">
        <h3 className="font-display text-sm font-semibold text-ctp-text mb-4">Aktivität</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetricField label="Schritte" unit="Schritte" value={steps} onChange={setSteps} step="1" inputMode="numeric" />
          <MetricField label="Aktive Minuten" unit="min" value={activeMinutes} onChange={setActiveMinutes} step="1" inputMode="numeric" />
          <MetricField label="Distanz" unit="km" value={distance} onChange={setDistance} step="0.01" />
          <MetricField label="Verbrannte Kalorien" unit="kcal" value={caloriesBurned} onChange={setCaloriesBurned} step="1" inputMode="numeric" />
        </div>
      </div>

      {/* Vitalwerte */}
      <div className="bg-ctp-base rounded-2xl border border-ctp-surface1 p-5">
        <h3 className="font-display text-sm font-semibold text-ctp-text mb-4">Vitalwerte</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetricField label="Ruheherzfrequenz" unit="bpm" value={restingHR} onChange={setRestingHR} step="1" inputMode="numeric" />
          <MetricField label="Schlafdauer" unit="min" value={sleepDuration} onChange={setSleepDuration} step="1" inputMode="numeric" />
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-movement-50 dark:bg-movement-600/10 border border-movement-200 dark:border-movement-600/20 rounded-lg text-sm text-movement-700 dark:text-movement-400">
          Metriken gespeichert.
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-movement-600 text-white rounded-xl text-sm font-medium hover:bg-movement-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Speichern...' : 'Metriken speichern'}
        </button>
      </div>
    </form>
  )
}
