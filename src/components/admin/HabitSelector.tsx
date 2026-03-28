'use client'

import { clsx } from 'clsx'
import { MovementLevel, NutritionLevel, SmokingStatus } from '@prisma/client'

// =============================================
// Typen
// =============================================

type HabitValue = MovementLevel | NutritionLevel | SmokingStatus

type FulfillmentState = 'fulfilled' | 'partial' | 'unfulfilled'

interface HabitOption<T extends HabitValue> {
  value: T
  label: string
  description: string
  fulfillment: FulfillmentState
}

interface PillarConfig {
  emoji: string
  title: string
  accentText: string
  accentBg: string
  accentBorder: string
  accentDot: string
  partialDot: string
}

// =============================================
// Konfiguration pro Säule
// =============================================

const PILLAR_CONFIG = {
  movement: {
    emoji: '🏃',
    title: 'Bewegung & Training',
    accentText: 'text-movement-700',
    accentBg: 'bg-movement-100',
    accentBorder: 'border-movement-300',
    accentDot: 'bg-movement-500',
    partialDot: 'bg-movement-200',
  },
  nutrition: {
    emoji: '🥗',
    title: 'Ernährung',
    accentText: 'text-nutrition-700',
    accentBg: 'bg-nutrition-100',
    accentBorder: 'border-nutrition-200',
    accentDot: 'bg-nutrition-500',
    partialDot: 'bg-nutrition-200',
  },
  smoking: {
    emoji: '🚭',
    title: 'Rauchstopp',
    accentText: 'text-smoking-700',
    accentBg: 'bg-smoking-100',
    accentBorder: 'border-smoking-200',
    accentDot: 'bg-smoking-500',
    partialDot: 'bg-smoking-200',
  },
} satisfies Record<string, PillarConfig>

// =============================================
// Optionen je Säule (mit Beschreibungen aus CLAUDE.md)
// =============================================

export const MOVEMENT_OPTIONS: HabitOption<MovementLevel>[] = [
  {
    value: 'MINIMAL',
    label: 'Minimal',
    description: 'Unter 10k Schritte, kein Training',
    fulfillment: 'unfulfilled',
  },
  {
    value: 'STEPS_ONLY',
    label: '10k+ Schritte',
    description: 'Über 10k Schritte, kein Training',
    fulfillment: 'fulfilled',
  },
  {
    value: 'STEPS_TRAINED',
    label: '10k+ & Training',
    description: 'Über 10k Schritte + Training',
    fulfillment: 'fulfilled',
  },
]

export const NUTRITION_OPTIONS: HabitOption<NutritionLevel>[] = [
  {
    value: 'NONE',
    label: '0 Mahlzeiten',
    description: 'Keine gesunde Mahlzeit',
    fulfillment: 'unfulfilled',
  },
  {
    value: 'ONE',
    label: '1 Mahlzeit',
    description: 'Eine gesunde Mahlzeit',
    fulfillment: 'fulfilled',
  },
  {
    value: 'TWO',
    label: '2 Mahlzeiten',
    description: 'Zwei gesunde Mahlzeiten',
    fulfillment: 'fulfilled',
  },
  {
    value: 'THREE',
    label: '3 Mahlzeiten',
    description: 'Drei gesunde Mahlzeiten',
    fulfillment: 'fulfilled',
  },
]

export const SMOKING_OPTIONS: HabitOption<SmokingStatus>[] = [
  {
    value: 'SMOKED',
    label: 'Geraucht',
    description: 'Es wurde geraucht',
    fulfillment: 'unfulfilled',
  },
  {
    value: 'REPLACEMENT',
    label: 'Nikotinersatz',
    description: 'Nicht geraucht, aber Nikotinersatz',
    fulfillment: 'partial',
  },
  {
    value: 'NONE',
    label: 'Rauchfrei',
    description: 'Rauchfrei ohne Hilfsmittel',
    fulfillment: 'fulfilled',
  },
]

// =============================================
// FulfillmentDot — visueller Indikator
// =============================================

function FulfillmentDot({
  fulfillment,
  cfg,
}: {
  fulfillment: FulfillmentState
  cfg: PillarConfig
}) {
  if (fulfillment === 'fulfilled') {
    return <span className={clsx('flex-none w-2 h-2 rounded-full', cfg.accentDot)} />
  }
  if (fulfillment === 'partial') {
    return (
      <span className="flex-none w-2 h-2 rounded-full bg-sand-300 ring-1 ring-sand-400 ring-offset-0" />
    )
  }
  return <span className="flex-none w-2 h-2 rounded-full bg-sand-200" />
}

// =============================================
// HabitSelector — Eine Säule
// =============================================

interface HabitSelectorProps<T extends HabitValue> {
  pillar: keyof typeof PILLAR_CONFIG
  options: HabitOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function HabitSelector<T extends HabitValue>({
  pillar,
  options,
  value,
  onChange,
}: HabitSelectorProps<T>) {
  const cfg = PILLAR_CONFIG[pillar]

  return (
    <div>
      {/* Säulen-Header */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-base" aria-hidden="true">
          {cfg.emoji}
        </span>
        <span className={clsx('text-xs font-semibold tracking-wide', cfg.accentText)}>
          {cfg.title}
        </span>
      </div>

      {/* Optionen */}
      <div className="flex flex-col gap-1.5">
        {options.map((opt) => {
          const isSelected = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={clsx(
                'group flex items-center gap-3 w-full text-left px-3.5 py-2.5 rounded-xl border transition-all duration-150',
                isSelected
                  ? [cfg.accentBg, cfg.accentBorder, cfg.accentText, 'shadow-sm']
                  : 'bg-white border-sand-200 text-[#2d2926] hover:border-sand-300 hover:bg-sand-50'
              )}
            >
              {/* Fulfillment-Indikator */}
              <FulfillmentDot fulfillment={opt.fulfillment} cfg={cfg} />

              {/* Text */}
              <div className="flex-1 min-w-0">
                <span
                  className={clsx(
                    'block text-xs font-semibold leading-tight',
                    isSelected ? cfg.accentText : 'text-[#1a1714]'
                  )}
                >
                  {opt.label}
                </span>
                <span
                  className={clsx(
                    'block text-xs leading-tight mt-0.5',
                    isSelected ? 'opacity-75' : 'text-sand-400'
                  )}
                >
                  {opt.description}
                </span>
              </div>

              {/* Ausgewählt-Indikator */}
              {isSelected && (
                <svg
                  className={clsx('flex-none w-4 h-4', cfg.accentText)}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
