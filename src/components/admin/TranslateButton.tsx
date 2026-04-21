'use client'

import { useTransition, useState } from 'react'
import { translateEntry } from '@/app/admin/entries/actions'

interface LocaleTranslation {
  updatedAt: Date
}

interface TranslateButtonProps {
  id: string
  entryUpdatedAt: Date
  enTranslation: LocaleTranslation | null
  ptTranslation: LocaleTranslation | null
}

type LocaleStatus = 'missing' | 'stale' | 'fresh'

function getStatus(translation: LocaleTranslation | null, entryUpdatedAt: Date): LocaleStatus {
  if (!translation) return 'missing'
  if (translation.updatedAt < entryUpdatedAt) return 'stale'
  return 'fresh'
}

function LocaleBtn({
  label,
  status,
  loading,
  disabled,
  onClick,
}: {
  label: string
  status: LocaleStatus
  loading: boolean
  disabled: boolean
  onClick: () => void
}) {
  const display = loading ? '…' : status === 'fresh' ? `${label} ✓` : status === 'stale' ? `${label} ⚠` : label
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-xs px-2 py-1.5 border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        status === 'fresh'
          ? 'border-movement-700 text-movement-400 hover:bg-movement-900/20'
          : status === 'stale'
            ? 'border-amber-700 text-amber-400 hover:bg-amber-900/20'
            : 'border-surface-container-high text-on-surface-variant hover:border-outline hover:text-on-surface'
      }`}
    >
      {display}
    </button>
  )
}

export function TranslateButton({ id, entryUpdatedAt, enTranslation, ptTranslation }: TranslateButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [pendingLocale, setPendingLocale] = useState<'en' | 'pt' | 'all' | null>(null)

  function handleTranslate(locale: 'en' | 'pt' | 'all') {
    setError(null)
    setPendingLocale(locale)
    startTransition(async () => {
      if (locale === 'all') {
        const [enResult, ptResult] = await Promise.all([
          translateEntry(id, 'en'),
          translateEntry(id, 'pt'),
        ])
        const err = enResult.error ?? ptResult.error
        if (err) setError(err)
      } else {
        const result = await translateEntry(id, locale)
        if (result.error) setError(result.error)
      }
      setPendingLocale(null)
    })
  }

  const enStatus = getStatus(enTranslation, entryUpdatedAt)
  const ptStatus = getStatus(ptTranslation, entryUpdatedAt)

  return (
    <div className="flex items-center gap-1 relative">
      <LocaleBtn
        label="EN"
        status={enStatus}
        loading={isPending && (pendingLocale === 'en' || pendingLocale === 'all')}
        disabled={isPending}
        onClick={() => handleTranslate('en')}
      />
      <LocaleBtn
        label="PT"
        status={ptStatus}
        loading={isPending && (pendingLocale === 'pt' || pendingLocale === 'all')}
        disabled={isPending}
        onClick={() => handleTranslate('pt')}
      />
      <button
        onClick={() => handleTranslate('all')}
        disabled={isPending}
        title="EN + PT übersetzen"
        className="text-xs px-2 py-1.5 border border-surface-container-high text-on-surface-variant rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:border-outline hover:text-on-surface"
      >
        {isPending && pendingLocale === 'all' ? '…' : 'Alle'}
      </button>

      {error && (
        <div className="absolute right-0 top-full mt-1 z-10 w-72 rounded-lg border border-red-800 bg-surface-container shadow-lg p-3">
          <p className="text-xs text-red-400 leading-snug">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-1.5 text-xs text-on-surface-variant hover:text-outline transition-colors"
          >
            Schließen
          </button>
        </div>
      )}
    </div>
  )
}
