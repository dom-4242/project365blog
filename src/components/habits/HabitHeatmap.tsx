import { useTranslations, useLocale } from 'next-intl'

type Pillar = 'movement' | 'nutrition' | 'smoking'

// All class names must be static strings for Tailwind to include them
const COLOR_BY_LEVEL: Record<Pillar, string[]> = {
  // index = level + 1  (level -1 → index 0)
  movement:  [
    'bg-sand-100 dark:bg-[#2d2926]',
    'bg-sand-200 dark:bg-[#3a3531]',
    'bg-movement-200 dark:bg-movement-800/40',
    'bg-movement-500 dark:bg-movement-400',
  ],
  nutrition: [
    'bg-sand-100 dark:bg-[#2d2926]',
    'bg-sand-200 dark:bg-[#3a3531]',
    'bg-nutrition-100 dark:bg-nutrition-800/30',
    'bg-nutrition-400 dark:bg-nutrition-500',
    'bg-nutrition-500 dark:bg-nutrition-400',
  ],
  smoking: [
    'bg-sand-100 dark:bg-[#2d2926]',
    'bg-sand-200 dark:bg-[#3a3531]',
    'bg-smoking-200 dark:bg-smoking-800/40',
    'bg-smoking-500 dark:bg-smoking-400',
  ],
}

// Maps level (0-based, i.e. level+1) to translation key within HabitHeatmap namespace
const LEVEL_KEYS: Record<Pillar, string[]> = {
  movement:  ['movement.minimal', 'movement.steps', 'movement.stepsAndTraining'],
  nutrition: ['nutrition.none', 'nutrition.one', 'nutrition.two', 'nutrition.three'],
  smoking:   ['smoking.smoked', 'smoking.replacement', 'smoking.smokeFree'],
}

interface HabitHeatmapProps {
  days: Array<{ date: string; level: number }> // level -1 = no entry
  pillar: Pillar
}

export function HabitHeatmap({ days, pillar }: HabitHeatmapProps) {
  const t = useTranslations('HabitHeatmap')
  const locale = useLocale()
  const colors = COLOR_BY_LEVEL[pillar]
  const levelKeys = LEVEL_KEYS[pillar]

  const visible = days.slice(-90)

  function formatDateShort(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
    })
  }

  function getLabel(level: number): string {
    if (level === -1) return t('noEntry')
    const key = levelKeys[level]
    return key ? t(key as Parameters<typeof t>[0]) : t('noEntry')
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-0.5">
        {visible.map(({ date, level }) => {
          const colorClass = colors[level + 1] ?? 'bg-sand-100 dark:bg-[#2d2926]'
          return (
            <div
              key={date}
              title={`${formatDateShort(date)} — ${getLabel(level)}`}
              className={`w-3 h-3 rounded-sm ${colorClass}`}
            />
          )
        })}
      </div>
      <p className="text-xs text-sand-400">
        {t('dayCount', { count: visible.length })}
      </p>
    </div>
  )
}
