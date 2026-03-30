'use client'

import { useEffect, useRef, useState } from 'react'
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
  const [popping, setPopping] = useState(false)
  const [bursting, setBursting] = useState(false)
  const prevActiveRef = useRef(active)

  // Burst ring when transitioning inactive → active
  useEffect(() => {
    if (!prevActiveRef.current && active) {
      setBursting(true)
      const t = setTimeout(() => setBursting(false), 600)
      prevActiveRef.current = active
      return () => clearTimeout(t)
    }
    prevActiveRef.current = active
  }, [active])

  const handleClick = () => {
    if (!active) {
      setPopping(true)
      setTimeout(() => setPopping(false), 450)
    }
    onClick()
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      title={label}
      aria-label={`${label}${count > 0 ? ` (${count})` : ''}`}
      aria-pressed={active}
      className={cn(
        'relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 select-none overflow-hidden',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand-400',
        active
          ? 'bg-sand-200 dark:bg-[#4a4540] text-[#1a1714] dark:text-[#faf9f7] ring-1 ring-sand-300 dark:ring-[#5a5550] scale-105'
          : 'bg-white dark:bg-[#2d2926] border border-sand-200 dark:border-[#4a4540] text-sand-500 dark:text-sand-400 hover:bg-sand-100 dark:hover:bg-[#3a3531] hover:text-sand-700 dark:hover:text-[#faf9f7] hover:border-sand-300',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      {/* Expanding ring burst on activation */}
      {bursting && (
        <span
          className="absolute inset-0 rounded-full bg-current animate-burst"
          aria-hidden="true"
        />
      )}

      <span
        className={cn('leading-none relative z-10', popping && 'animate-emoji-pop')}
        aria-hidden="true"
      >
        {emoji}
      </span>

      {count > 0 && (
        <span className="text-xs tabular-nums relative z-10">{count}</span>
      )}
    </button>
  )
}
