'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveRefeedRuleAction } from '@/app/admin/nutrition/actions'

const WEEKDAYS = [
  { iso: 1, label: 'Mo' },
  { iso: 2, label: 'Di' },
  { iso: 3, label: 'Mi' },
  { iso: 4, label: 'Do' },
  { iso: 5, label: 'Fr' },
  { iso: 6, label: 'Sa' },
  { iso: 7, label: 'So' },
]

interface Props {
  initialWeekdays: number[]
  derivedSoll: { kcal: number; proteinG: number; fatG: number; carbsG: number } | null
}

export function RefeedRuleForm({ initialWeekdays, derivedSoll }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<number>>(new Set(initialWeekdays))
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  function toggle(iso: number) {
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(iso)) next.delete(iso)
      else next.add(iso)
      return next
    })
  }

  function save() {
    setMsg(null)
    startTransition(async () => {
      const r = await saveRefeedRuleAction([...selected])
      if (r.error) setMsg({ kind: 'err', text: r.error })
      else {
        setMsg({ kind: 'ok', text: 'Refeed-Regel gespeichert.' })
        router.refresh()
      }
    })
  }

  return (
    <div className="bg-surface-container rounded-2xl border border-surface-container-high p-5 space-y-4">
      <div>
        <p className="text-xs font-medium text-on-surface-variant mb-2">Wiederkehrende Refeed-Wochentage</p>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAYS.map((w) => (
            <button
              key={w.iso}
              type="button"
              onClick={() => toggle(w.iso)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selected.has(w.iso)
                  ? 'bg-tertiary/20 text-tertiary border border-tertiary/40'
                  : 'border border-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {derivedSoll ? (
        <p className="text-xs text-on-surface-variant">
          Refeed-SOLL (abgeleitet): <span className="text-on-surface">{derivedSoll.kcal} kcal</span> ·
          P {derivedSoll.proteinG} g · F {derivedSoll.fatG} g · KH {derivedSoll.carbsG} g
        </p>
      ) : (
        <p className="text-xs text-on-surface-variant">Eckdaten nötig für die SOLL-Ableitung.</p>
      )}

      {msg && (
        <div className={`p-2.5 rounded-lg text-sm ${msg.kind === 'ok' ? 'bg-primary/10 border border-primary/30 text-primary' : 'bg-error/10 border border-error/30 text-error'}`}>
          {msg.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-on-surface-variant">Leere Auswahl = keine wiederkehrenden Refeed-Tage.</p>
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="px-5 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary-container disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Speichern…' : 'Speichern'}
        </button>
      </div>
    </div>
  )
}
