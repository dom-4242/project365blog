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

const LABEL_BY_LEVEL: Record<Pillar, string[]> = {
  movement:  ['Kein Eintrag', 'Minimal aktiv', '10.000+ Schritte', '10.000+ Schritte & Training'],
  nutrition: ['Kein Eintrag', 'Keine gesunde Mahlzeit', '1 gesunde Mahlzeit', '2 gesunde Mahlzeiten', '3 gesunde Mahlzeiten'],
  smoking:   ['Kein Eintrag', 'Geraucht', 'Nikotinersatz', 'Rauchfrei'],
}

interface HabitHeatmapProps {
  days: Array<{ date: string; level: number }> // level -1 = no entry
  pillar: Pillar
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'short',
  })
}

export function HabitHeatmap({ days, pillar }: HabitHeatmapProps) {
  const colors = COLOR_BY_LEVEL[pillar]
  const labels = LABEL_BY_LEVEL[pillar]

  const visible = days.slice(-90)

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-0.5">
        {visible.map(({ date, level }) => {
          const colorClass = colors[level + 1] ?? 'bg-sand-100 dark:bg-[#2d2926]'
          const labelText = labels[level + 1] ?? 'Kein Eintrag'
          return (
            <div
              key={date}
              title={`${formatDateShort(date)} — ${labelText}`}
              className={`w-3 h-3 rounded-sm ${colorClass}`}
            />
          )
        })}
      </div>
      <p className="text-xs text-sand-400">
        {visible.length} {visible.length === 1 ? 'Tag' : 'Tage'} seit Projektstart
      </p>
    </div>
  )
}
