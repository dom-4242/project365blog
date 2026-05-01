'use client'

import { clsx } from 'clsx'
import { MovementLevel, NutritionLevel, SmokingStatus } from '@prisma/client'
import {
  HabitSelector,
  MOVEMENT_OPTIONS,
  NUTRITION_OPTIONS,
  SMOKING_OPTIONS,
} from './HabitSelector'

// =============================================
// Fulfillment-Status aus den Prisma-Enum-Werten
// =============================================

function isMovementFulfilled(m: MovementLevel): boolean {
  return m === 'STEPS_ONLY' || m === 'TRAINED_ONLY' || m === 'STEPS_TRAINED'
}
function isNutritionFulfilled(n: NutritionLevel): boolean {
  return n === 'THREE_MEALS'
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
  nutrition: NutritionLevel
  smoking: SmokingStatus
  onMovementChange: (v: MovementLevel) => void
  onNutritionChange: (v: NutritionLevel) => void
  onSmokingChange: (v: SmokingStatus) => void
  nutritionLocked?: boolean
  mealScore?: number | null
}

// =============================================
// HabitsPicker
// =============================================

export function HabitsPicker({
  movement,
  nutrition,
  smoking,
  onMovementChange,
  onNutritionChange,
  onSmokingChange,
  nutritionLocked = false,
  mealScore,
}: HabitsPickerProps) {
  const movementLabel = MOVEMENT_OPTIONS.find((o) => o.value === movement)?.label ?? movement
  const nutritionLabel = NUTRITION_OPTIONS.find((o) => o.value === nutrition)?.label ?? nutrition
  const smokingLabel = SMOKING_OPTIONS.find((o) => o.value === smoking)?.label ?? smoking

  const fulfilledCount = [
    isMovementFulfilled(movement),
    isNutritionFulfilled(nutrition),
    isSmokingFulfilled(smoking),
  ].filter(Boolean).length

  return (
    <div className="bg-surface-container rounded-2xl border border-surface-container-high overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-surface-container">
        <h3 className="font-headline text-sm font-semibold text-on-surface">Die drei Säulen</h3>
        <span
          className={clsx(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            fulfilledCount === 3
              ? 'bg-movement-100 text-movement-700'
              : fulfilledCount === 0
              ? 'bg-surface-container text-on-surface-variant'
              : 'bg-nutrition-100 text-nutrition-700'
          )}
        >
          {fulfilledCount}/3 erfüllt
        </span>
      </div>

      {/* Selektoren */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 p-5">
        <HabitSelector
          pillar="movement"
          options={MOVEMENT_OPTIONS}
          value={movement}
          onChange={onMovementChange}
        />
        {nutritionLocked ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="material-symbols-outlined text-[14px] text-nutrition-400">lock</span>
              <span className="text-xs font-label font-bold tracking-widest uppercase text-nutrition-400">Ernährung</span>
            </div>
            <div className="rounded-lg border border-nutrition-400/30 bg-nutrition-400/5 px-3 py-3 flex flex-col gap-1.5">
              <span className="text-xs text-on-surface-variant">Automatisch vom Meal-Log</span>
              {mealScore !== null && mealScore !== undefined && (
                <span className="text-lg font-headline font-bold text-nutrition-300">
                  {mealScore.toFixed(1)}<span className="text-xs font-normal text-on-surface-variant ml-0.5">/10</span>
                </span>
              )}
              <span className="text-sm font-medium text-on-surface">
                {NUTRITION_OPTIONS.find((o) => o.value === nutrition)?.label ?? nutrition}
              </span>
            </div>
          </div>
        ) : (
          <HabitSelector
            pillar="nutrition"
            options={NUTRITION_OPTIONS}
            value={nutrition}
            onChange={onNutritionChange}
          />
        )}
        <HabitSelector
          pillar="smoking"
          options={SMOKING_OPTIONS}
          value={smoking}
          onChange={onSmokingChange}
        />
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
            label={nutritionLabel}
            fulfilled={isNutritionFulfilled(nutrition)}
            colorClass="bg-nutrition-100 text-nutrition-700"
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
