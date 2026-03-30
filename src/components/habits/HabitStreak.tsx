'use client'

import { useEffect, useRef, useState } from 'react'

interface HabitStreakProps {
  current: number
  longest: number
  totalFulfilled: number
  totalEntries: number
  label: string
  textColorClass: string
  barColorClass: string
}

function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    if (target === 0) {
      setValue(0)
      return
    }

    startedRef.current = true

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }

    const startTime = performance.now()
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setValue(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [target, duration])

  return value
}

export function HabitStreak({
  current,
  longest,
  totalFulfilled,
  totalEntries,
  label,
  textColorClass,
  barColorClass,
}: HabitStreakProps) {
  const displayCurrent = useCountUp(current)
  const pct = totalEntries > 0 ? Math.round((totalFulfilled / totalEntries) * 100) : 0
  const isRecord = current > 0 && current === longest && longest > 1

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-baseline gap-2">
          <span className={`text-5xl font-bold font-display leading-none tabular-nums ${textColorClass}`}>
            {displayCurrent}
          </span>
          <span className="text-sm text-sand-500 font-medium leading-tight">{label}</span>
        </div>
        <p className="text-xs text-sand-400 mt-1 h-4">
          {isRecord
            ? '= persönlicher Rekord 🏆'
            : longest > current && longest > 0
              ? `Rekord: ${longest} Tage`
              : ''}
        </p>
      </div>

      {totalEntries > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-sand-400">
            <span>
              {totalFulfilled} von {totalEntries} {totalEntries === 1 ? 'Tag' : 'Tagen'}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-1 bg-sand-200 dark:bg-[#4a4540] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full motion-safe:transition-all motion-safe:duration-1000 ${barColorClass}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
