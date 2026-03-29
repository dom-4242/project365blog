interface HabitStreakProps {
  current: number
  longest: number
  totalFulfilled: number
  totalEntries: number
  label: string
  textColorClass: string
  barColorClass: string
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
  const pct = totalEntries > 0 ? Math.round((totalFulfilled / totalEntries) * 100) : 0
  const isRecord = current > 0 && current === longest && longest > 1

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-baseline gap-2">
          <span className={`text-5xl font-bold font-display leading-none ${textColorClass}`}>
            {current}
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
              className={`h-full rounded-full ${barColorClass}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
