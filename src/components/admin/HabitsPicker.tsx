'use client'

import { clsx } from 'clsx'
import { MovementLevel, SmokingStatus } from '@prisma/client'
import {
  HabitSelector,
  MOVEMENT_OPTIONS,
  SMOKING_OPTIONS,
} from './HabitSelector'

// =============================================
// Fulfillment-Status aus den Prisma-Enum-Werten.
// Ernährung ist seit N-09 nicht mehr manuell — sie wird aus dem Food-Logging
// (Day.fulfillmentStatus) abgeleitet und daher hier nicht mehr gepickt.
// =============================================

function isMovementFulfilled(m: MovementLevel): boolean {
  return m === 'STEPS_ONLY' || m === 'TRAINED_ONLY' || m === 'STEPS_TRAINED'
}
function isSmokingFulfilled(s: SmokingStatus): boolean {
  return s === 'NICOTINE_REPLACEMENT' || s === 'SMOKE_FREE'
}

// =============================================
// Vorschau-Badge
// =============================================

interface PreviewBadgeProps {
  label: string
  fulfilled: boolean
  colorClass: string
}

function PreviewBadge({ label, fulfilled, colorClass }: PreviewBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
        fulfilled ? colorClass : 'bg-surface-container-high text-on-surface-variant'
      )}
    >
      <span
        className={clsx(
          'w-1.5 h-1.5 rounded-full bg-current',
          !fulfilled && 'opacity-30'
        )}
      />
      {label}
    </span>
  )
}

// =============================================
// Props
// =============================================

interface HabitsPickerProps {
  movement: MovementLevel
  smoking: SmokingStatus
  onMovementChange: (v: MovementLevel) => void
  onSmokingChange: (v: SmokingStatus) => void
}

// =============================================
// HabitsPicker (Bewegung + Rauchstopp; Ernährung kommt aus dem Logging)
// =============================================

export function HabitsPicker({
  movement,
  smoking,
  onMovementChange,
  onSmokingChange,
}: HabitsPickerProps) {
  const movementLabel = MOVEMENT_OPTIONS.find((o) => o.value === movement)?.label ?? movement
  const smokingLabel = SMOKING_OPTIONS.find((o) => o.value === smoking)?.label ?? smoking

  const fulfilledCount = [
    isMovementFulfilled(movement),
    isSmokingFulfilled(smoking),
  ].filter(Boolean).length

  return (
    <div className="bg-surface-container rounded-2xl border border-surface-container-high overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-surface-container">
        <h3 className="font-headline text-sm font-semibold text-on-surface">Säulen (manuell)</h3>
        <span
          className={clsx(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            fulfilledCount === 2
              ? 'bg-movement-100 text-movement-700'
              : fulfilledCount === 0
              ? 'bg-surface-container text-on-surface-variant'
              : 'bg-nutrition-100 text-nutrition-700'
          )}
        >
          {fulfilledCount}/2 erfüllt
        </span>
      </div>

      {/* Selektoren */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5">
        <HabitSelector
          pillar="movement"
          options={MOVEMENT_OPTIONS}
          value={movement}
          onChange={onMovementChange}
        />
        <HabitSelector
          pillar="smoking"
          options={SMOKING_OPTIONS}
          value={smoking}
          onChange={onSmokingChange}
        />
      </div>

      {/* Hinweis Ernährung */}
      <div className="px-5 pb-3 -mt-2">
        <p className="text-xs text-on-surface-variant">
          Die Ernährungs-Säule wird automatisch aus dem Food-Logging (Kaloriendefizit) des Tages abgeleitet.
        </p>
      </div>

      {/* Live-Vorschau */}
      <div className="flex items-center gap-3 px-5 py-3 bg-surface-container border-t border-surface-container-high">
        <span className="text-xs text-on-surface-variant shrink-0">Vorschau:</span>
        <div className="flex flex-wrap gap-1.5">
          <PreviewBadge
            label={movementLabel}
            fulfilled={isMovementFulfilled(movement)}
            colorClass="bg-movement-100 text-movement-700"
          />
          <PreviewBadge
            label={smokingLabel}
            fulfilled={isSmokingFulfilled(smoking)}
            colorClass="bg-smoking-100 text-smoking-700"
          />
        </div>
      </div>
    </div>
  )
}
