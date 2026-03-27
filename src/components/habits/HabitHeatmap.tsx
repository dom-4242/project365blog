type Pillar = 'movement' | 'nutrition' | 'smoking'

// All class names must be static strings for Tailwind to include them
const COLOR_BY_LEVEL: Record<Pillar, string[]> = {
  // index = level + 1  (level -1 → index 0)
  movement:  ['bg-sand-100', 'bg-sand-200', 'bg-movement-200', 'bg-movement-500'],
  nutrition: ['bg-sand-100', 'bg-sand-200', 'bg-nutrition-100', 'bg-nutrition-400', 'bg-nutrition-500'],
  smoking:   ['bg-sand-100', 'bg-sand-200', 'bg-smoking-200', 'bg-smoking-500'],
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

  // Show last 90 days max, oldest first (left → right)
  const visible = days.slice(-90)

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-0.5">
        {visible.map(({ date, level }) => {
          const colorClass = colors[level + 1] ?? 'bg-sand-100'
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
