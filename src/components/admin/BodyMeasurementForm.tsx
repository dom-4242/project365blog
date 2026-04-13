'use client'

import { useState, useTransition } from 'react'
import { saveMeasurement, type MeasurementFormData } from '@/app/admin/body-measurements/actions'

interface BodyMeasurementFormProps {
  date: string
  initial?: Partial<MeasurementFormData>
}

const FIELDS: { key: keyof MeasurementFormData; label: string; hint?: string }[] = [
  { key: 'chest',         label: 'Brust',             hint: 'Höhe Brustwarzen' },
  { key: 'waist',         label: 'Taille',             hint: 'schmalste Stelle' },
  { key: 'hip',           label: 'Hüfte',              hint: 'breiteste Stelle' },
  { key: 'upperArmLeft',  label: 'Oberarm links',      hint: 'angespannt' },
  { key: 'upperArmRight', label: 'Oberarm rechts',     hint: 'angespannt' },
  { key: 'thighLeft',     label: 'Oberschenkel links', hint: 'dickste Stelle' },
  { key: 'thighRight',    label: 'Oberschenkel rechts',hint: 'dickste Stelle' },
  { key: 'calfLeft',      label: 'Wade links',         hint: 'dickste Stelle' },
  { key: 'calfRight',     label: 'Wade rechts',        hint: 'dickste Stelle' },
  { key: 'neck',          label: 'Hals',               hint: 'optional' },
]

export function BodyMeasurementForm({ date, initial }: BodyMeasurementFormProps) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [values, setValues] = useState<Partial<MeasurementFormData>>({
    chest:         initial?.chest         ?? '',
    waist:         initial?.waist         ?? '',
    hip:           initial?.hip           ?? '',
    upperArmLeft:  initial?.upperArmLeft  ?? '',
    upperArmRight: initial?.upperArmRight ?? '',
    thighLeft:     initial?.thighLeft     ?? '',
    thighRight:    initial?.thighRight    ?? '',
    calfLeft:      initial?.calfLeft      ?? '',
    calfRight:     initial?.calfRight     ?? '',
    neck:          initial?.neck          ?? '',
    notes:         initial?.notes         ?? '',
  })

  function handleChange(key: keyof MeasurementFormData, value: string) {
    setValues((v) => ({ ...v, [key]: value }))
    setSaved(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await saveMeasurement({ date, ...values } as MeasurementFormData)
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Messanleitung */}
      <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-4 text-xs text-on-surface-variant space-y-1">
        <p className="font-semibold text-on-surface mb-2">Messanleitung</p>
        <p>• Morgens, nüchtern, vor dem Training messen</p>
        <p>• Massband straff aber nicht einschneidend anlegen</p>
        <p>• Jede Messung 2× durchführen, Durchschnitt nehmen</p>
        <p>• Empfehlung: alle 2–4 Wochen messen</p>
      </div>

      {/* Felder */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {FIELDS.map(({ key, label, hint }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">
              {label}
              {hint && <span className="font-normal ml-1 text-outline">({hint})</span>}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="200"
                value={values[key] ?? ''}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder="—"
                className="w-full border border-surface-container-high rounded-lg px-3 py-1.5 pr-9 text-sm text-on-surface focus:outline-none focus:border-on-surface-variant bg-surface-container"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant pointer-events-none">cm</span>
            </div>
          </div>
        ))}
      </div>

      {/* Notizen */}
      <div>
        <label className="block text-xs font-medium text-on-surface-variant mb-1">Notizen</label>
        <textarea
          value={values.notes ?? ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={2}
          placeholder="z.B. nach dem Frühstück gemessen, leicht aufgepumpt..."
          className="w-full border border-surface-container-high rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-on-surface-variant bg-surface-container resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-container disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Speichern…' : 'Masse speichern'}
        </button>
        {saved && <span className="text-sm text-on-surface-variant">Gespeichert ✓</span>}
      </div>
    </form>
  )
}
