'use client'

import { useTransition, useState } from 'react'
import { DrinkType } from '@prisma/client'
import { logDrink, deleteDrink, setSweetsConsumed } from '@/app/admin/quick-log/actions'

interface LogEntry {
  id: string
  type: DrinkType
  time: string
}

interface QuickLogButtonsProps {
  recentEntries: LogEntry[]
  sweetsConsumed: boolean | null
}

interface Feedback {
  type: DrinkType
  key: number
}

export function QuickLogButtons({ recentEntries, sweetsConsumed }: QuickLogButtonsProps) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [sweetsLocal, setSweetsLocal] = useState<boolean | null>(sweetsConsumed)
  const [sweetsError, setSweetsError] = useState<string | null>(null)

  function handleSweets(value: boolean | null) {
    setSweetsError(null)
    const prev = sweetsLocal
    setSweetsLocal(value)
    startTransition(async () => {
      const result = await setSweetsConsumed(value)
      if (result.error) {
        setSweetsLocal(prev)
        setSweetsError(result.error)
      }
    })
  }

  function handleLog(type: DrinkType) {
    const key = Date.now()
    setFeedback({ type, key })
    setTimeout(() => setFeedback(null), 800)
    startTransition(async () => {
      await logDrink(type)
    })
  }

  function handleDelete(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      await deleteDrink(id)
      setDeletingId(null)
    })
  }

  return (
    <div className="space-y-8">
      {/* Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleLog('WATER')}
          disabled={isPending}
          className="relative flex flex-col items-center justify-center gap-3 rounded-2xl bg-surface-container border border-surface-container-high p-8 active:scale-95 transition-transform disabled:opacity-60 select-none"
        >
          {feedback?.type === 'WATER' && (
            <span key={feedback.key} className="absolute inset-0 rounded-2xl bg-blue-400/20 animate-ping" />
          )}
          <span className="text-5xl">💧</span>
          <span className="font-label text-xs font-bold tracking-widest uppercase text-on-surface-variant">Wasser</span>
          <span className="text-xs text-on-surface-variant">600 ml</span>
        </button>

        <button
          onClick={() => handleLog('COLA_ZERO')}
          disabled={isPending}
          className="relative flex flex-col items-center justify-center gap-3 rounded-2xl bg-surface-container border border-surface-container-high p-8 active:scale-95 transition-transform disabled:opacity-60 select-none"
        >
          {feedback?.type === 'COLA_ZERO' && (
            <span key={feedback.key} className="absolute inset-0 rounded-2xl bg-red-400/20 animate-ping" />
          )}
          <span className="text-5xl">🥤</span>
          <span className="font-label text-xs font-bold tracking-widest uppercase text-on-surface-variant">Cola Zero</span>
          <span className="text-xs text-on-surface-variant">330 ml</span>
        </button>
      </div>

      {/* Sweets tracking */}
      <div>
        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Süssigkeiten heute</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleSweets(false)}
            disabled={isPending}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl p-4 border transition-all disabled:opacity-60 active:scale-95 ${
              sweetsLocal === false
                ? 'bg-movement-400/20 border-movement-400/50 text-movement-300'
                : 'bg-surface-container border-surface-container-high text-on-surface-variant'
            }`}
          >
            <span className="text-2xl">✅</span>
            <span className="font-label text-xs font-bold tracking-widest uppercase">Keine</span>
          </button>
          <button
            onClick={() => handleSweets(true)}
            disabled={isPending}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl p-4 border transition-all disabled:opacity-60 active:scale-95 ${
              sweetsLocal === true
                ? 'bg-error/20 border-error/50 text-error'
                : 'bg-surface-container border-surface-container-high text-on-surface-variant'
            }`}
          >
            <span className="text-2xl">🍫</span>
            <span className="font-label text-xs font-bold tracking-widest uppercase">Konsumiert</span>
          </button>
          <button
            onClick={() => handleSweets(null)}
            disabled={isPending || sweetsLocal === null}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl p-4 border bg-surface-container border-surface-container-high text-on-surface-variant transition-all disabled:opacity-40 active:scale-95"
          >
            <span className="text-2xl">↩</span>
            <span className="font-label text-xs font-bold tracking-widest uppercase">Reset</span>
          </button>
        </div>
        {sweetsError && (
          <p className="text-xs text-error mt-2">{sweetsError}</p>
        )}
      </div>

      {/* Recent entries (today) */}
      {recentEntries.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">Heute</p>
          <div className="space-y-1">
            {recentEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container text-sm"
              >
                <span>{entry.type === 'WATER' ? '💧 Wasser' : '🥤 Cola Zero'}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-on-surface-variant">{entry.time}</span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingId === entry.id || isPending}
                    className="text-on-surface-variant hover:text-error transition-colors disabled:opacity-40"
                    aria-label="Eintrag löschen"
                  >
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0" }}>
                      delete
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
