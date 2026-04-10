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
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-surface-variant',
        active
          ? 'bg-surface-container-high text-on-surface ring-1 ring-outline ring-on-surface-variant scale-105'
          : 'bg-surface-container border border-surface-container-high text-on-surface-variant text-on-surface-variant hover:bg-surface-container hover:bg-surface-container hover:text-sand-700 hover:text-on-surface hover:border-outline',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <span className="leading-none" aria-hidden="true">{emoji}</span>
      {count > 0 && (
        <span className="text-xs tabular-nums">{count}</span>
      )}
    </button>
  )
}
