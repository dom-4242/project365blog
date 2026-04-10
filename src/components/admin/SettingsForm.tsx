'use client'

import { useState, useTransition } from 'react'
import { upsertProfile, type ProfileFormData } from '@/app/admin/settings/actions'

interface SettingsFormProps {
  initial: ProfileFormData
}

interface FieldProps {
  label: string
  unit: string
  hint?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  step?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}

function SettingField({ label, unit, hint, value, onChange, placeholder = '—', step = 'any', inputMode = 'decimal' }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-on-surface-variant mb-1">
        {label} <span className="font-normal text-on-surface-variant">({unit})</span>
      </label>
      {hint && <p className="text-xs text-on-surface-variant mb-1.5">{hint}</p>}
      <input
        type="number"
        inputMode={inputMode}
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

export function SettingsForm({ initial }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [heightCm, setHeightCm] = useState(initial.heightCm)
  const [targetWeight, setTargetWeight] = useState(initial.targetWeight)
  const [targetSteps, setTargetSteps] = useState(initial.targetSteps)
  const [projectStartDate, setProjectStartDate] = useState(initial.projectStartDate)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await upsertProfile({ heightCm, targetWeight, targetSteps, projectStartDate })
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Körperprofil */}
      <div className="bg-surface-container rounded-2xl border border-surface-container-high p-5">
        <h3 className="font-display text-sm font-semibold text-on-surface mb-1">Körperprofil</h3>
        <p className="text-xs text-on-surface-variant mb-4">Wird für die automatische BMI-Berechnung verwendet.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SettingField
            label="Körpergrösse"
            unit="cm"
            value={heightCm}
            onChange={setHeightCm}
            placeholder="z. B. 178"
            step="0.1"
          />
        </div>
      </div>

      {/* Ziele */}
      <div className="bg-surface-container rounded-2xl border border-surface-container-high p-5">
        <h3 className="font-display text-sm font-semibold text-on-surface mb-1">Ziele</h3>
        <p className="text-xs text-on-surface-variant mb-4">Persönliche Zielwerte für die Metriken-Darstellung.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SettingField
            label="Zielgewicht"
            unit="kg"
            value={targetWeight}
            onChange={setTargetWeight}
            placeholder="z. B. 85"
            step="0.1"
          />
          <SettingField
            label="Tagesziel Schritte"
            unit="Schritte"
            value={targetSteps}
            onChange={setTargetSteps}
            placeholder="z. B. 10000"
            step="500"
            inputMode="numeric"
          />
        </div>
      </div>

      {/* Projekt */}
      <div className="bg-surface-container rounded-2xl border border-surface-container-high p-5">
        <h3 className="font-display text-sm font-semibold text-on-surface mb-1">Projekt</h3>
        <p className="text-xs text-on-surface-variant mb-4">Bestimmt den Projekttag für alle Anzeigen (Tag 1 = Startdatum).</p>
        <div className="max-w-xs">
          <label className="block text-xs font-medium text-on-surface-variant mb-1">
            Startdatum <span className="font-normal text-on-surface-variant">(YYYY-MM-DD)</span>
          </label>
          <input
            type="date"
            value={projectStartDate}
            onChange={(e) => setProjectStartDate(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            placeholder="2026-03-26"
            className="w-full border border-surface-container-high rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-on-surface-variant bg-surface-container"
          />
          <p className="text-xs text-on-surface-variant mt-1">Default: 2026-03-26 (falls nicht gesetzt)</p>
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div className="p-3 bg-red-50 bg-red-900/20 border border-red-200 border-red-800/40 rounded-lg text-sm text-red-700 text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-movement-50 bg-movement-600/10 border border-movement-200 border-movement-600/20 rounded-lg text-sm text-movement-700 text-movement-400">
          Einstellungen gespeichert.
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-movement-600 text-white rounded-xl text-sm font-medium hover:bg-movement-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Speichern...' : 'Einstellungen speichern'}
        </button>
      </div>
    </form>
  )
}
