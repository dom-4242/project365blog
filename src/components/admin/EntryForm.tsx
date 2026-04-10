'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MovementLevel, NutritionLevel, SmokingStatus } from '@prisma/client'
import { clsx } from 'clsx'
import { TiptapEditor } from './TiptapEditor'
import { HabitsPicker } from './HabitsPicker'
import { BannerUpload } from './BannerUpload'
import { EntryPreview } from './EntryPreview'
import { createEntry, updateEntry, type EntryFormData } from '@/app/admin/entries/actions'

// =============================================
// Helper
// =============================================

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

function slugFromDate(date: string): string {
  return date || todayString()
}

// =============================================
// Props
// =============================================

interface EntryFormProps {
  mode: 'create' | 'edit'
  entryId?: string
  initial?: Partial<EntryFormData>
}

// =============================================
// Component
// =============================================

export function EntryForm({ mode, entryId, initial }: EntryFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const today = todayString()

  const [title, setTitle] = useState(initial?.title ?? '')
  const [date, setDate] = useState(initial?.date ?? today)
  const [slug, setSlug] = useState(initial?.slug ?? slugFromDate(today))
  const [content, setContent] = useState(initial?.content ?? '')
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '')
  const [movement, setMovement] = useState<MovementLevel>(initial?.movement ?? 'STEPS_ONLY')
  const [nutrition, setNutrition] = useState<NutritionLevel>(initial?.nutrition ?? 'TWO_MEALS')
  const [smoking, setSmoking] = useState<SmokingStatus>(initial?.smoking ?? 'SMOKE_FREE')
  const [bannerUrl, setBannerUrl] = useState<string | undefined>(initial?.bannerUrl)
  const [tags, setTags] = useState<string>(initial?.tags?.join(', ') ?? '')
  const [published, setPublished] = useState(initial?.published ?? true)
  const [error, setError] = useState<string | null>(null)
  const [isPreview, setIsPreview] = useState(false)

  // Auto-generate slug from date when creating
  function handleDateChange(value: string) {
    setDate(value)
    if (mode === 'create') {
      setSlug(slugFromDate(value))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const data: EntryFormData = {
      title,
      slug,
      date,
      content,
      excerpt,
      bannerUrl,
      movement,
      nutrition,
      smoking,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      published,
    }

    startTransition(async () => {
      const result =
        mode === 'create' ? await createEntry(data) : await updateEntry(entryId!, data)

      if (result.error) {
        setError(result.error)
        return
      }

      router.push(result.slug ? `/journal/${result.slug}` : '/admin/entries')
    })
  }

  return (
    <div className="space-y-4">
      {/* Editor / Vorschau Toggle */}
      <div className="flex items-center gap-1 bg-ctp-mantle rounded-lg p-1 w-fit">
        <button
          type="button"
          onClick={() => setIsPreview(false)}
          className={clsx(
            'px-3 py-1 rounded-md text-sm font-medium transition-colors',
            !isPreview
              ? 'bg-ctp-surface0 text-ctp-text shadow-sm'
              : 'text-sand-500 hover:text-ctp-text'
          )}
        >
          Bearbeiten
        </button>
        <button
          type="button"
          onClick={() => setIsPreview(true)}
          className={clsx(
            'px-3 py-1 rounded-md text-sm font-medium transition-colors',
            isPreview
              ? 'bg-ctp-surface0 text-ctp-text shadow-sm'
              : 'text-sand-500 hover:text-ctp-text'
          )}
        >
          Vorschau
        </button>
      </div>

      {isPreview ? (
        <EntryPreview
          title={title}
          date={date}
          content={content}
          movement={movement}
          nutrition={nutrition}
          smoking={smoking}
          tags={tags}
          bannerUrl={bannerUrl}
        />
      ) : (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Titel */}
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titel des Eintrags"
          required
          className="w-full font-display text-2xl font-bold bg-transparent border-0 border-b-2 border-ctp-surface1 focus:border-nutrition-500 focus:outline-none pb-2 text-ctp-text placeholder:text-sand-300 transition-colors"
        />
      </div>

      {/* Datum + Slug + Veröffentlicht */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-none">
          <label className="block text-xs font-medium text-sand-500 mb-1">Datum</label>
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            required
            className="border border-ctp-surface1 rounded-lg px-3 py-1.5 text-sm text-ctp-text focus:outline-none focus:border-sand-400 bg-ctp-surface0"
          />
        </div>

        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-sand-500 mb-1">
            Slug{' '}
            {mode === 'edit' && (
              <span className="text-sand-400 font-normal">(nicht änderbar)</span>
            )}
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            readOnly={mode === 'edit'}
            required
            className={clsx(
              'w-full border border-ctp-surface1 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none bg-ctp-surface0',
              mode === 'edit'
                ? 'text-sand-400 cursor-default'
                : 'text-ctp-text focus:border-sand-400'
            )}
          />
        </div>

        <div className="flex items-center gap-2 pb-1.5">
          <button
            type="button"
            onClick={() => setPublished((p) => !p)}
            className={clsx(
              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
              published ? 'bg-movement-500' : 'bg-sand-300'
            )}
          >
            <span
              className={clsx(
                'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
                published ? 'translate-x-4.5' : 'translate-x-0.5'
              )}
            />
          </button>
          <span className="text-sm text-sand-500">{published ? 'Veröffentlicht' : 'Entwurf'}</span>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs font-medium text-sand-500 mb-1">
          Tags <span className="text-sand-400 font-normal">(kommagetrennt, optional)</span>
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="motivation, training, ernährung"
          className="w-full border border-ctp-surface1 rounded-lg px-3 py-1.5 text-sm text-ctp-text focus:outline-none focus:border-sand-400 bg-ctp-surface0"
        />
      </div>

      {/* Banner-Bild */}
      <BannerUpload value={bannerUrl} onChange={setBannerUrl} slug={slug} title={title} excerpt={excerpt} />

      {/* Tiptap Editor */}
      <div>
        <label className="block text-xs font-medium text-sand-500 mb-1">Inhalt</label>
        <TiptapEditor
          content={content}
          onChange={setContent}
          placeholder="Schreibe deinen heutigen Eintrag..."
        />
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-xs font-medium text-sand-500 mb-1">
          Kurzbeschreibung{' '}
          <span className="text-sand-400 font-normal">(optional — für SEO, RSS, Suche &amp; Feed-Vorschau; wird sonst automatisch generiert)</span>
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          placeholder="1–2 Sätze, die den Eintrag zusammenfassen..."
          className="w-full border border-ctp-surface1 rounded-lg px-3 py-2 text-sm text-ctp-text focus:outline-none focus:border-sand-400 bg-ctp-surface0 resize-none"
        />
      </div>

      {/* Die drei Säulen */}
      <HabitsPicker
        movement={movement}
        nutrition={nutrition}
        smoking={smoking}
        onMovementChange={setMovement}
        onNutritionChange={setNutrition}
        onSmokingChange={setSmoking}
      />

      {/* Submit */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-sand-500 hover:text-ctp-text transition-colors"
        >
          ← Abbrechen
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-nutrition-600 text-white rounded-xl text-sm font-medium hover:bg-nutrition-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending
            ? 'Speichern...'
            : mode === 'create'
            ? 'Eintrag erstellen'
            : 'Änderungen speichern'}
        </button>
      </div>
    </form>
      )}
    </div>
  )
}
