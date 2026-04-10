'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteEntry } from '@/app/admin/entries/actions'

interface DeleteEntryButtonProps {
  id: string
  title: string
}

export function DeleteEntryButton({ id, title }: DeleteEntryButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteEntry(id)
      if (result.error) {
        setError(result.error)
        setShowConfirm(false)
      } else {
        router.push('/admin/entries?deleted=1')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => { setError(null); setShowConfirm(true) }}
        className="text-xs px-3 py-1.5 border border-red-200 border-red-900/50 rounded-lg text-red-500 text-red-400 hover:border-red-300 hover:border-red-800 hover:bg-red-50 hover:bg-red-950/30 hover:text-red-700 hover:text-red-300 transition-colors"
      >
        Löschen
      </button>

      {error && (
        <span className="text-xs text-red-500 ml-2">{error}</span>
      )}

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isPending && setShowConfirm(false)}
          />

          {/* Dialog */}
          <div className="relative bg-surface-container rounded-2xl border border-surface-container-high shadow-xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none mt-0.5" aria-hidden="true">🗑️</span>
              <div>
                <h2
                  id="delete-dialog-title"
                  className="font-display font-bold text-lg text-on-surface leading-tight"
                >
                  Eintrag löschen?
                </h2>
                <p className="text-sm text-on-surface-variant text-on-surface-variant mt-1">
                  <span className="font-medium text-on-surface">&bdquo;{title}&ldquo;</span>{' '}
                  wird dauerhaft gelöscht &mdash; inklusive aller Reaktionen.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="px-4 py-2 text-sm border border-surface-container-high rounded-xl text-on-surface-variant text-on-surface-variant hover:border-outline hover:border-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isPending ? 'Wird gelöscht…' : 'Endgültig löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
