'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MovementLevel, NutritionLevel, SmokingStatus } from '@prisma/client'
import { clsx } from 'clsx'
import { TiptapEditor } from './TiptapEditor'
import { createEntry, updateEntry, type EntryFormData } from '@/app/admin/entries/actions'

// =============================================
// Habit-Selektoren Konfiguration
// =============================================

const MOVEMENT_OPTIONS: { value: MovementLevel; label: string; desc: string }[] = [
  { value: 'MINIMAL', label: 'Minimal', desc: 'Unter 10k, kein Training' },
  { value: 'STEPS_ONLY', label: '10k+', desc: '10k+ Schritte' },
  { value: 'STEPS_TRAINED', label: '10k+ & Training', desc: '10k+ & Training' },
]

const NUTRITION_OPTIONS: { value: NutritionLevel; label: string }[] = [
  { value: 'NONE', label: '0' },
  { value: 'ONE', label: '1' },
  { value: 'TWO', label: '2' },
  { value: 'THREE', label: '3' },
]

const SMOKING_OPTIONS: { value: SmokingStatus; label: string; desc: string }[] = [
  { value: 'SMOKED', label: 'Geraucht', desc: 'Geraucht' },
  { value: 'REPLACEMENT', label: 'Ersatz', desc: 'Nikotinersatz' },
  { value: 'NONE', label: 'Rauchfrei', desc: 'Rauchfrei ohne Hilfsmittel' },
]

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
  const [nutrition, setNutrition] = useState<NutritionLevel>(initial?.nutrition ?? 'TWO')
  const [smoking, setSmoking] = useState<SmokingStatus>(initial?.smoking ?? 'NONE')
  const [tags, setTags] = useState<string>(initial?.tags?.join(', ') ?? '')
  const [published, setPublished] = useState(initial?.published ?? true)
  const [error, setError] = useState<string | null>(null)

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
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
          className="w-full font-display text-2xl font-bold bg-transparent border-0 border-b-2 border-sand-200 focus:border-nutrition-500 focus:outline-none pb-2 text-[#1a1714] placeholder:text-sand-300 transition-colors"
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
            className="border border-sand-200 rounded-lg px-3 py-1.5 text-sm text-[#2d2926] focus:outline-none focus:border-sand-400 bg-white"
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
              'w-full border border-sand-200 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none bg-white',
              mode === 'edit'
                ? 'text-sand-400 cursor-default'
                : 'text-[#2d2926] focus:border-sand-400'
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
          className="w-full border border-sand-200 rounded-lg px-3 py-1.5 text-sm text-[#2d2926] focus:outline-none focus:border-sand-400 bg-white"
        />
      </div>

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
          Excerpt{' '}
          <span className="text-sand-400 font-normal">(optional — wird sonst automatisch generiert)</span>
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          placeholder="Kurze Beschreibung für den Feed..."
          className="w-full border border-sand-200 rounded-lg px-3 py-2 text-sm text-[#2d2926] focus:outline-none focus:border-sand-400 bg-white resize-none"
        />
      </div>

      {/* Die drei Säulen */}
      <div className="bg-white rounded-2xl border border-sand-200 p-5">
        <h3 className="font-display text-sm font-semibold text-[#1a1714] mb-4">Die drei Säulen</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Bewegung */}
          <div>
            <p className="text-xs font-medium text-movement-700 mb-2">🏃 Bewegung</p>
            <div className="flex flex-col gap-1.5">
              {MOVEMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMovement(opt.value)}
                  className={clsx(
                    'text-left px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
                    movement === opt.value
                      ? 'bg-movement-100 border-movement-300 text-movement-700'
                      : 'bg-white border-sand-200 text-sand-500 hover:border-movement-200 hover:text-movement-700'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ernährung */}
          <div>
            <p className="text-xs font-medium text-nutrition-700 mb-2">🥗 Ernährung</p>
            <div className="flex flex-col gap-1.5">
              {NUTRITION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setNutrition(opt.value)}
                  className={clsx(
                    'text-left px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
                    nutrition === opt.value
                      ? 'bg-nutrition-100 border-nutrition-200 text-nutrition-700'
                      : 'bg-white border-sand-200 text-sand-500 hover:border-nutrition-200 hover:text-nutrition-700'
                  )}
                >
                  {opt.label === '0' ? '0 gesunde Mahlzeiten' :
                   opt.label === '1' ? '1 gesunde Mahlzeit' :
                   opt.label === '2' ? '2 gesunde Mahlzeiten' :
                   '3 gesunde Mahlzeiten'}
                </button>
              ))}
            </div>
          </div>

          {/* Rauchstopp */}
          <div>
            <p className="text-xs font-medium text-smoking-700 mb-2">🚭 Rauchstopp</p>
            <div className="flex flex-col gap-1.5">
              {SMOKING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSmoking(opt.value)}
                  className={clsx(
                    'text-left px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
                    smoking === opt.value
                      ? 'bg-smoking-100 border-smoking-200 text-smoking-700'
                      : 'bg-white border-sand-200 text-sand-500 hover:border-smoking-200 hover:text-smoking-700'
                  )}
                >
                  {opt.desc}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-sand-500 hover:text-[#1a1714] transition-colors"
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
  )
}
