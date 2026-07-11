'use client'

import { useState, useTransition } from 'react'
import { setPublicSollIst } from '@/app/admin/settings/actions'

interface Props {
  current: boolean
}

export function PublicSollIstForm({ current }: Props) {
  const [enabled, setEnabled] = useState(current)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function toggle() {
    const next = !enabled
    setEnabled(next)
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await setPublicSollIst(next)
      if (result.error) {
        setError(result.error)
        setEnabled(!next) // rollback
      } else {
        setSuccess(true)
      }
    })
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-3 cursor-pointer">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={isPending}
          onClick={toggle}
          className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors disabled:opacity-50 ${
            enabled ? 'bg-primary' : 'bg-surface-container-high'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-on-primary transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-sm text-on-surface">
          {enabled ? 'kcal SOLL/IST öffentlich sichtbar' : 'kcal SOLL/IST nur intern'}
        </span>
      </label>
      {error && <p className="text-sm text-error">{error}</p>}
      {success && <p className="text-sm text-movement-400">Gespeichert.</p>}
    </div>
  )
}
