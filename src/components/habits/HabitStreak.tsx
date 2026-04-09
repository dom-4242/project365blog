import { useTranslations } from 'next-intl'

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
  const t = useTranslations('HabitStreak')
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
            ? t('record')
            : longest > current && longest > 0
              ? t('longestRecord', { days: longest })
              : ''}
        </p>
      </div>

      {totalEntries > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-sand-400">
            <span>
              {t('outOf', {
                fulfilled: totalFulfilled,
                total: totalEntries,
                unit: totalEntries === 1 ? t('day') : t('days'),
              })}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-1 bg-ctp-surface1 rounded-full overflow-hidden">
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
