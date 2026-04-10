'use client'

import { useRef, useState } from 'react'

interface BannerUploadProps {
  value: string | undefined
  onChange: (url: string | undefined) => void
  slug: string
  title?: string
  excerpt?: string
}

export function BannerUpload({ value, onChange, slug, title, excerpt }: BannerUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const busy = uploading || generating

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('slug', slug)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      const data = (await res.json()) as { url?: string; error?: string }

      if (!res.ok || !data.url) {
        setError(data.error ?? 'Upload fehlgeschlagen')
        return
      }

      onChange(data.url)
    } catch {
      setError('Upload fehlgeschlagen')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleGenerate() {
    setError(null)
    setGenerating(true)

    try {
      const res = await fetch('/api/admin/generate-banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, excerpt, slug }),
      })

      const data = (await res.json()) as { url?: string; error?: string }

      if (!res.ok || !data.url) {
        setError(data.error ?? 'Generierung fehlgeschlagen')
        return
      }

      onChange(data.url)
    } catch {
      setError('Generierung fehlgeschlagen')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-sand-500 mb-1">
        Banner-Bild{' '}
        <span className="text-sand-400 font-normal">(optional · 16:7 · max 5 MB · JPEG/PNG/WebP)</span>
      </label>

      {value ? (
        /* Vorschau mit Aktionen */
        <div className="relative rounded-xl overflow-hidden bg-ctp-surface0 border border-ctp-surface1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Banner-Vorschau"
            className="w-full object-cover"
            style={{ aspectRatio: '16/7' }}
          />
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={busy}
              className="px-3 py-1.5 bg-white/90 dark:bg-ctp-base/90 backdrop-blur-sm border border-ctp-surface1 rounded-lg text-xs font-medium text-ctp-mauve hover:bg-white dark:hover:bg-ctp-base transition-colors shadow-sm disabled:opacity-50"
            >
              {generating ? 'Generiert...' : 'AI neu'}
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="px-3 py-1.5 bg-white/90 dark:bg-ctp-base/90 backdrop-blur-sm border border-ctp-surface1 rounded-lg text-xs font-medium text-ctp-text hover:bg-white dark:hover:bg-ctp-base transition-colors shadow-sm disabled:opacity-50"
            >
              {uploading ? 'Lädt...' : 'Ersetzen'}
            </button>
            <button
              type="button"
              onClick={() => onChange(undefined)}
              disabled={busy}
              className="px-3 py-1.5 bg-white/90 dark:bg-ctp-base/90 backdrop-blur-sm border border-red-200 dark:border-red-800/40 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-white dark:hover:bg-ctp-base transition-colors shadow-sm disabled:opacity-50"
            >
              Entfernen
            </button>
          </div>
        </div>
      ) : (
        /* Upload-Zone + AI-Generierung */
        <div className="flex gap-3" style={{ aspectRatio: '16/7' }}>
          {/* Manueller Upload */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-ctp-surface1 rounded-xl bg-ctp-base hover:bg-sand-100 dark:hover:bg-ctp-surface0 hover:border-sand-300 dark:hover:border-ctp-overlay2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <span className="text-sm text-sand-400">Hochladen...</span>
            ) : (
              <>
                <svg
                  className="w-8 h-8 text-sand-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <span className="text-sm text-sand-400 font-medium">Bild hochladen</span>
              </>
            )}
          </button>

          {/* AI-Generierung */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={busy}
            className="flex-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-ctp-mauve/40 rounded-xl bg-ctp-base hover:bg-ctp-mauve/5 hover:border-ctp-mauve/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <svg
                  className="w-8 h-8 text-ctp-mauve animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm text-ctp-mauve font-medium">Wird generiert...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-8 h-8 text-ctp-mauve/60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                  />
                </svg>
                <span className="text-sm text-ctp-mauve/80 font-medium">AI generieren</span>
                <span className="text-xs text-sand-400">aus Titel &amp; Inhalt</span>
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="sr-only"
      />
    </div>
  )
}
