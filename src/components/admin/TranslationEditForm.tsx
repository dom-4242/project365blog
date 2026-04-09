'use client'

import { useTransition, useState } from 'react'
import { updateTranslation } from '@/app/admin/translations/actions'
import { translateEntry } from '@/app/admin/entries/actions'

interface TranslationEditFormProps {
  entryId: string
  locale: 'en' | 'pt'
  initialTitle: string
  initialExcerpt: string
  initialContent: string
}

export function TranslationEditForm({
  entryId,
  locale,
  initialTitle,
  initialExcerpt,
  initialContent,
}: TranslationEditFormProps) {
  const [title, setTitle] = useState(initialTitle)
  const [excerpt, setExcerpt] = useState(initialExcerpt)
  const [content, setContent] = useState(initialContent)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [translateError, setTranslateError] = useState<string | null>(null)

  const [isSaving, startSave] = useTransition()
  const [isTranslating, startTranslate] = useTransition()

  function handleSave() {
    setSaveError(null)
    setSaveSuccess(false)
    startSave(async () => {
      const result = await updateTranslation(entryId, { title, excerpt, content, locale })
      if (result.error) setSaveError(result.error)
      else setSaveSuccess(true)
    })
  }

  function handleRetranslate() {
    setTranslateError(null)
    setSaveSuccess(false)
    startTranslate(async () => {
      const result = await translateEntry(entryId, locale)
      if (result.error) {
        setTranslateError(result.error)
      } else {
        // Reload page to show fresh translation
        window.location.reload()
      }
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-sand-500 uppercase tracking-wide mb-1.5">
          Titel
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setSaveSuccess(false) }}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-[#2d2926] border border-sand-200 dark:border-[#4a4540] rounded-lg text-[#1a1714] dark:text-[#faf9f7] focus:outline-none focus:border-nutrition-500 dark:focus:border-nutrition-400 transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-sand-500 uppercase tracking-wide mb-1.5">
          Excerpt
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => { setExcerpt(e.target.value); setSaveSuccess(false) }}
          rows={3}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-[#2d2926] border border-sand-200 dark:border-[#4a4540] rounded-lg text-[#1a1714] dark:text-[#faf9f7] focus:outline-none focus:border-nutrition-500 dark:focus:border-nutrition-400 transition-colors resize-y"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-sand-500 uppercase tracking-wide mb-1.5">
          Inhalt (HTML)
        </label>
        <textarea
          value={content}
          onChange={(e) => { setContent(e.target.value); setSaveSuccess(false) }}
          rows={14}
          className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-[#2d2926] border border-sand-200 dark:border-[#4a4540] rounded-lg text-[#1a1714] dark:text-[#faf9f7] focus:outline-none focus:border-nutrition-500 dark:focus:border-nutrition-400 transition-colors resize-y"
        />
      </div>

      {saveError && (
        <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
      )}
      {translateError && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
          <p className="text-sm text-red-600 dark:text-red-400 leading-snug">{translateError}</p>
        </div>
      )}
      {saveSuccess && (
        <p className="text-sm text-movement-600 dark:text-movement-400">Gespeichert ✓</p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSave}
          disabled={isSaving || isTranslating}
          className="px-4 py-2 bg-nutrition-600 text-white rounded-xl text-sm font-medium hover:bg-nutrition-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Speichere…' : 'Speichern'}
        </button>
        <button
          onClick={handleRetranslate}
          disabled={isSaving || isTranslating}
          className="flex items-center gap-2 px-4 py-2 border border-sand-200 dark:border-[#4a4540] rounded-xl text-sm font-medium text-sand-600 dark:text-sand-400 hover:border-sand-300 hover:text-[#1a1714] dark:hover:text-[#faf9f7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTranslating ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Übersetze…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              Neu übersetzen (KI)
            </>
          )}
        </button>
      </div>
    </div>
  )
}
