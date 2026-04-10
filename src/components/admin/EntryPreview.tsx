'use client'

import Image from 'next/image'
import type { MovementLevel, NutritionLevel, SmokingStatus } from '@prisma/client'
import { getDayNumber } from '@/lib/journal'

// =============================================
// Habit labels — admin is always DE
// =============================================

const MOVEMENT_LABELS: Record<MovementLevel, string> = {
  MINIMAL: 'Wenig Bewegung',
  STEPS_ONLY: '10k+ Schritte',
  TRAINED_ONLY: 'Training',
  STEPS_TRAINED: '10k+ & Training',
}
const NUTRITION_LABELS: Record<NutritionLevel, string> = {
  NONE: 'Keine ges. Mahlzeit',
  ONE_MEAL: '1 ges. Mahlzeit',
  TWO_MEALS: '2 ges. Mahlzeiten',
  THREE_MEALS: '3 ges. Mahlzeiten',
}
const SMOKING_LABELS: Record<SmokingStatus, string> = {
  SMOKED: 'Geraucht',
  NICOTINE_REPLACEMENT: 'Nikotinersatz',
  SMOKE_FREE: 'Rauchfrei',
}

function isMovementOk(m: MovementLevel) {
  return m === 'STEPS_ONLY' || m === 'TRAINED_ONLY' || m === 'STEPS_TRAINED'
}
function isNutritionOk(n: NutritionLevel) {
  return n === 'TWO_MEALS' || n === 'THREE_MEALS'
}
function isSmokingOk(s: SmokingStatus) {
  return s === 'NICOTINE_REPLACEMENT' || s === 'SMOKE_FREE'
}

// =============================================
// Inline habit badge
// =============================================

interface HabitBadgeProps {
  label: string
  fulfilled: boolean
  colorClass: string
}

function HabitBadge({ label, fulfilled, colorClass }: HabitBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
        fulfilled ? colorClass : 'bg-surface-container text-on-surface-variant'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full bg-current ${fulfilled ? '' : 'opacity-30'}`} />
      {label}
    </span>
  )
}

// =============================================
// Props
// =============================================

export interface EntryPreviewProps {
  title: string
  date: string
  content: string
  movement: MovementLevel
  nutrition: NutritionLevel
  smoking: SmokingStatus
  tags: string
  bannerUrl?: string
}

// =============================================
// Component
// =============================================

export function EntryPreview({
  title,
  date,
  content,
  movement,
  nutrition,
  smoking,
  tags,
  bannerUrl,
}: EntryPreviewProps) {
  const dayNumber = date ? getDayNumber(date) : 1

  const formattedDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('de-CH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  const tagList = tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  return (
    <div className="bg-surface-container rounded-xl border border-surface-container-high overflow-hidden">
      {/* Preview label */}
      <div className="flex items-center gap-2 px-4 py-2 bg-surface-container border-b border-surface-container-high">
        <svg className="w-3.5 h-3.5 text-on-surface-variant" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
        <span className="text-xs font-medium text-on-surface-variant">Vorschau</span>
        <span className="text-xs text-on-surface-variant">— so sieht der Eintrag nach der Veröffentlichung aus</span>
      </div>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Banner */}
        {bannerUrl && (
          <div className="relative w-full aspect-[16/7] rounded-2xl overflow-hidden mb-10 bg-surface-container">
            <Image
              src={bannerUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
        )}

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-display font-bold text-xs tracking-widest uppercase text-on-surface-variant border border-surface-container-high rounded px-2 py-0.5">
              Tag {dayNumber}
            </span>
            {formattedDate && (
              <>
                <span className="text-outline text-surface-container-high select-none" aria-hidden="true">·</span>
                <time className="text-sm text-on-surface-variant">{formattedDate}</time>
              </>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight text-on-surface mb-5">
            {title || <span className="text-outline font-normal italic">Titel…</span>}
          </h1>

          {/* Habit badges */}
          <div className="flex flex-wrap gap-1.5">
            <HabitBadge
              label={MOVEMENT_LABELS[movement]}
              fulfilled={isMovementOk(movement)}
              colorClass="bg-movement-100 bg-movement-600/20 text-movement-700 text-movement-400"
            />
            <HabitBadge
              label={NUTRITION_LABELS[nutrition]}
              fulfilled={isNutritionOk(nutrition)}
              colorClass="bg-nutrition-100 bg-nutrition-600/20 text-nutrition-700 text-nutrition-400"
            />
            <HabitBadge
              label={SMOKING_LABELS[smoking]}
              fulfilled={isSmokingOk(smoking)}
              colorClass="bg-smoking-100 bg-smoking-600/20 text-smoking-700 text-smoking-400"
            />
          </div>

          {/* Tags */}
          {tagList.length > 0 && (
            <ul className="flex flex-wrap gap-2 mt-3">
              {tagList.map((tag) => (
                <li
                  key={tag}
                  className="text-xs px-2.5 py-1 bg-surface-container text-on-surface-variant rounded-full"
                >
                  #{tag}
                </li>
              ))}
            </ul>
          )}
        </header>

        <hr className="border-surface-container-high mb-10" />

        {/* Content */}
        {content ? (
          <div
            className="prose prose-stone prose-lg max-w-none prose-invert"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <p className="text-outline text-surface-container-high italic text-sm">Noch kein Inhalt…</p>
        )}
      </article>
    </div>
  )
}
