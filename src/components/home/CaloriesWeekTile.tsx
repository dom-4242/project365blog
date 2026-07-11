import type { PublicKcalWeek } from '@/lib/nutrition/public-week'
import { computeKcalChartModel } from '@/lib/nutrition/public-week'

interface CaloriesWeekTileProps {
  data: PublicKcalWeek
  locale: string
  labels: {
    title: string
    target: string
    noData: string
    phaseDeficit: string
    phaseMaintenance: string
    phaseSurplus: string
  }
}

const PHASE_STYLE = {
  DEFICIT: { badge: 'bg-primary/15 text-primary border-primary/30', zone: 'bg-primary/10', bar: 'bg-primary' },
  MAINTENANCE: { badge: 'bg-surface-container-high text-on-surface border-outline-variant/30', zone: 'bg-on-surface/5', bar: 'bg-on-surface' },
  SURPLUS: { badge: 'bg-tertiary/15 text-tertiary border-tertiary/30', zone: 'bg-tertiary/10', bar: 'bg-tertiary' },
} as const

function weekdayShort(dateStr: string, locale: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(locale, { weekday: 'short' })
}

export function CaloriesWeekTile({ data, locale, labels }: CaloriesWeekTileProps) {
  const phaseStyle = data.phaseMode ? PHASE_STYLE[data.phaseMode] : null
  const phaseLabel = data.phaseMode
    ? { DEFICIT: labels.phaseDeficit, MAINTENANCE: labels.phaseMaintenance, SURPLUS: labels.phaseSurplus }[data.phaseMode]
    : null

  const model = computeKcalChartModel(data.days, data.sollLine, data.phaseMode)

  return (
    <div className="col-span-1 sm:col-span-1 lg:col-span-6 bg-surface-container border border-outline-variant/10 rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant">{labels.title}</p>
        {phaseLabel && phaseStyle && (
          <span className={`shrink-0 text-[10px] font-label font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border ${phaseStyle.badge}`}>
            {phaseLabel}
          </span>
        )}
      </div>

      {data.hasData ? (
        <>
          {/* Ø IST / SOLL */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-headline font-bold tracking-tighter leading-none text-on-surface tabular-nums">
              {data.avgIst?.toLocaleString('de-CH') ?? '—'}
            </span>
            {data.avgSoll != null && (
              <span className="text-sm text-on-surface-variant tabular-nums">/ {data.avgSoll.toLocaleString('de-CH')} kcal</span>
            )}
          </div>

          {/* Balken + SOLL-Linie + Ziel-Zone */}
          <div>
            <div className="relative h-20">
              {/* Ziel-Zone (phasenabhängig) */}
              {model.zone && phaseStyle && (
                <div
                  className={`absolute left-0 right-0 rounded-sm ${phaseStyle.zone}`}
                  style={{ top: `${model.zone.topPct}%`, height: `${model.zone.heightPct}%` }}
                  aria-hidden="true"
                />
              )}
              {/* SOLL-Linie */}
              {model.sollTopPct != null && (
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-outline-variant/50"
                  style={{ top: `${model.sollTopPct}%` }}
                  aria-hidden="true"
                />
              )}
              {/* Balken */}
              <div className="absolute inset-0 flex items-end gap-1.5">
                {model.bars.map((b) => (
                  <div key={b.date} className="flex-1 flex items-end justify-center h-full">
                    {b.hasValue ? (
                      <div
                        className={`w-full max-w-[16px] rounded-sm transition-all ${
                          b.fulfilled === true
                            ? (phaseStyle?.bar ?? 'bg-primary')
                            : b.fulfilled === false
                              ? 'bg-error/55'
                              : 'bg-outline/40'
                        } ${b.isRefeed ? 'ring-1 ring-tertiary/60' : ''}`}
                        style={{ height: `${Math.max(b.heightPct, 3)}%` }}
                        title={`${weekdayShort(b.date, locale)}: ${data.days.find((d) => d.date === b.date)?.ist?.toLocaleString('de-CH') ?? '–'} kcal`}
                      />
                    ) : (
                      <div className="w-full max-w-[16px] h-[3%] rounded-sm bg-outline-variant/20" title={`${weekdayShort(b.date, locale)}: –`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Wochentag-Labels */}
            <div className="flex gap-1.5 mt-1.5">
              {model.bars.map((b) => (
                <span key={b.date} className="flex-1 text-center text-[10px] text-on-surface-variant/70">
                  {weekdayShort(b.date, locale).slice(0, 2)}
                </span>
              ))}
            </div>
          </div>

          {data.sollLine != null && (
            <p className="text-[11px] text-on-surface-variant/70">
              {labels.target}: {data.sollLine.toLocaleString('de-CH')} kcal
            </p>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center">
          <p className="text-sm text-on-surface-variant">{labels.noData}</p>
        </div>
      )}
    </div>
  )
}
