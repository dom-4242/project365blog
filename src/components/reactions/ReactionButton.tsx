'use client'

import { cn } from '@/lib/utils'

interface ReactionButtonProps {
  emoji: string
  label: string
  count: number
  active: boolean
  disabled: boolean
  onClick: () => void
}

export function ReactionButton({ emoji, label, count, active, disabled, onClick }: ReactionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={`${label}${count > 0 ? ` (${count})` : ''}`}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand-400',
        active
          ? 'bg-nutrition-100 text-nutrition-800 ring-1 ring-nutrition-300 scale-105'
          : 'bg-sand-100 text-sand-600 hover:bg-sand-200 hover:text-sand-800',
        disabled && 'cursor-not-allowed opacity-70',
      )}
    >
      <span className="leading-none" aria-hidden="true">{emoji}</span>
      {count > 0 && (
        <span className="text-xs tabular-nums">{count}</span>
      )}
    </button>
  )
}
