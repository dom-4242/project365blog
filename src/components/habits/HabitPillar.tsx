import { useTranslations } from 'next-intl'

type Pillar = 'movement' | 'nutrition' | 'smoking'

interface PillarConfig {
  emoji: string
  textColorClass: string
  strokeColorClass: string
  bgBarClass: string
}

const PILLAR_CONFIG: Record<Pillar, PillarConfig> = {
  movement: {
    emoji: '🏃',
    textColorClass:   'text-movement-400',
    strokeColorClass: 'stroke-movement-400',
    bgBarClass:       'bg-movement-400',
  },
  nutrition: {
    emoji: '🥗',
    textColorClass:   'text-nutrition-400',
    strokeColorClass: 'stroke-nutrition-400',
    bgBarClass:       'bg-nutrition-400',
  },
  smoking: {
    emoji: '🚭',
    textColorClass:   'text-smoking-400',
    strokeColorClass: 'stroke-smoking-400',
    bgBarClass:       'bg-smoking-400',
  },
}

interface HabitPillarProps {
  pillar: Pillar
  totalFulfilled: number
  totalEntries: number
  recentFulfilled: number
  recentTotal: number
}

export function HabitPillar({
  pillar,
  totalFulfilled,
  totalEntries,
  recentFulfilled,
  recentTotal,
}: HabitPillarProps) {
  const t = useTranslations('HabitPillar')
  const cfg = PILLAR_CONFIG[pillar]

  const title = t(`${pillar}.title` as `movement.title`)
  const pct = totalEntries > 0 ? Math.round((totalFulfilled / totalEntries) * 100) : 0
  const recentPct = recentTotal > 0 ? Math.round((recentFulfilled / recentTotal) * 100) : 0

  // Donut geometry
  const size = 140
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = (pct / 100) * c

  return (
    <div className="bg-surface-container border border-outline-variant/15 rounded-xl overflow-hidden flex flex-col">
      <div className={`h-0.5 shrink-0 ${cfg.bgBarClass}`} />

      <div className="p-5 flex flex-col gap-4 flex-1">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <span className={`text-xs font-label font-bold tracking-widest uppercase ${cfg.textColorClass}`}>
            {title}
          </span>
          <span className="text-base leading-none" aria-hidden="true">{cfg.emoji}</span>
        </div>

        {/* Donut */}
        <div className="flex flex-col items-center gap-2 flex-1 justify-center">
          <div className="relative" style={{ width: size, height: size }}>
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="-rotate-90"
              aria-hidden="true"
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                strokeWidth={stroke}
                className="stroke-surface-container-high"
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${c - dash}`}
                className={`${cfg.strokeColorClass} transition-[stroke-dasharray] duration-700`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-headline font-bold tracking-tighter leading-none ${cfg.textColorClass}`}>
                {pct}%
              </span>
              <span className="text-[10px] font-label font-bold tracking-widest uppercase text-on-surface-variant mt-1">
                {t('achievedLabel')}
              </span>
            </div>
          </div>

          {/* Secondary */}
          <div className="text-center space-y-0.5">
            <p className="text-xs text-on-surface-variant">
              {t('outOfDays', { fulfilled: totalFulfilled, total: totalEntries })}
            </p>
            {recentTotal > 0 && (
              <p className="text-[11px] text-on-surface-variant/70">
                {t('last30', { pct: recentPct })}
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
