'use client'

import { useState, useTransition } from 'react'
import { setPriorityPillar } from '@/app/admin/settings/actions'
import type { PriorityPillar } from '@/lib/settings'

const OPTIONS: { value: PriorityPillar; label: string; description: string }[] = [
  { value: 'smoking',   label: 'Rauchstopp',  description: 'Rauchfreie Tage & Nikotinfreiheit' },
  { value: 'movement',  label: 'Bewegung',    description: '10k Schritte & Training' },
  { value: 'nutrition', label: 'Ernährung',   description: 'Mindestens 2 Mahlzeiten täglich' },
]

interface Props {
  current: PriorityPillar
}

export function PriorityPillarForm({ current }: Props) {
  const [selected, setSelected] = useState<PriorityPillar>(current)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await setPriorityPillar(selected)
      if (result.error) setError(result.error)
      else setSuccess(true)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-2">
        {OPTIONS.map((opt) => {
          const active = selected === opt.value
          return (
            <label
              key={opt.value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                active
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-surface-container-high bg-surface-container hover:border-outline-variant/40'
              }`}
            >
              <input
                type="radio"
                name="priority_pillar"
                value={opt.value}
                checked={active}
                onChange={() => setSelected(opt.value)}
                className="accent-primary"
              />
              <div>
                <p className="text-sm font-semibold text-on-surface">{opt.label}</p>
                <p className="text-xs text-on-surface-variant">{opt.description}</p>
              </div>
              {active && (
                <span className="ml-auto text-xs font-label font-bold tracking-widest uppercase text-primary">
                  Aktiv
                </span>
              )}
            </label>
          )
        })}
      </div>

      {error && (
        <p className="text-sm text-error">{error}</p>
      )}
      {success && (
        <p className="text-sm text-movement-400">Priorität gespeichert.</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || selected === current}
          className="px-5 py-2 bg-primary text-on-primary rounded text-xs font-label font-bold tracking-widest uppercase hover:bg-primary-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Speichern…' : 'Speichern'}
        </button>
      </div>
    </form>
  )
}
