'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { clsx } from 'clsx'
import { Icon } from '@/components/ui/Icon'
import { MacroDonut } from './MacroDonut'
import { SectionCard, formatDate } from './shared'
import type { CoachDietPhase, CoachNutritionDay, CoachNutritionWeek } from '@/lib/coach'

const PHASE_MODE_KEY: Record<string, string> = {
  DEFICIT: 'phaseDeficit',
  MAINTENANCE: 'phaseMaintenance',
  SURPLUS: 'phaseSurplus',
}

function KcalCompare({ ist, soll }: { ist: number | null; soll: number | null }) {
  const t = useTranslations('Coach')
  const pct = ist != null && soll && soll > 0 ? Math.min((ist / soll) * 100, 120) : 0
  const over = ist != null && soll != null && ist > soll
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-headline text-on-surface tabular-nums">
            {ist != null ? Math.round(ist) : '—'}
          </span>
          <span className="text-sm text-on-surface-variant">
            / {soll != null ? Math.round(soll) : '—'} kcal
          </span>
        </div>
        <span className="text-[10px] font-label font-bold tracking-widest uppercase text-on-surface-variant">
          {t('istSoll')}
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-container-low overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all', over ? 'bg-error' : 'bg-primary')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function DietPhaseCard({ phase }: { phase: CoachDietPhase | null }) {
  const t = useTranslations('Coach')
  const locale = useLocale()

  if (!phase) {
    return (
      <SectionCard title={t('dietPhase')}>
        <p className="text-sm text-on-surface-variant">{t('noActivePhase')}</p>
      </SectionCard>
    )
  }

  const eck: Array<[string, string]> = [
    [t('targetKcal'), phase.targetKcal != null ? `${phase.targetKcal} kcal` : '—'],
    [t('protein'), phase.proteinG != null ? `${phase.proteinG} g` : '—'],
    [t('carbs'), phase.carbsG != null ? `${phase.carbsG} g` : '—'],
    [t('fat'), phase.fatG != null ? `${phase.fatG} g` : '—'],
    [t('mealsPerDay'), phase.mealsPerDay != null ? String(phase.mealsPerDay) : '—'],
    [t('baseWeight'), phase.baseWeightKg != null ? `${phase.baseWeightKg} kg` : '—'],
  ]

  return (
    <SectionCard
      title={t('dietPhase')}
      action={
        <span className="text-[10px] font-label font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-primary/15 text-primary">
          {t(PHASE_MODE_KEY[phase.mode] ?? 'phaseDeficit')}
        </span>
      }
    >
      <p className="text-xs text-on-surface-variant mb-3">
        {t('since')} {formatDate(phase.startDate, locale)}
        {phase.endDate ? ` – ${formatDate(phase.endDate, locale)}` : ''}
      </p>
      {phase.note && <p className="text-sm text-on-surface mb-3 leading-relaxed">{phase.note}</p>}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
        {eck.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-2 border-b border-outline-variant/10 pb-1">
            <dt className="text-xs text-on-surface-variant">{label}</dt>
            <dd className="text-sm font-semibold text-on-surface tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {phase.calcNote && (
        <p className="text-[11px] text-on-surface-variant mt-3 leading-relaxed">{phase.calcNote}</p>
      )}
    </SectionCard>
  )
}

function DayPanel({ days }: { days: CoachNutritionDay[] }) {
  const t = useTranslations('Coach')
  const locale = useLocale()
  // Default to the most recent day that has data, else the last day.
  const defaultIdx = useMemo(() => {
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].hasData) return i
    }
    return days.length - 1
  }, [days])
  const [idx, setIdx] = useState(defaultIdx)

  if (days.length === 0) {
    return (
      <SectionCard title={t('dayView')}>
        <p className="text-sm text-on-surface-variant">{t('noData')}</p>
      </SectionCard>
    )
  }

  const day = days[idx]

  // Gespeicherte Slot-Werte sind die deutschen MEAL_SLOTS; für DE/EN/PT lokalisieren.
  const slotLabel = (slot: string | null): string => {
    switch (slot) {
      case 'Frühstück':
        return t('mealBreakfast')
      case 'Mittag':
        return t('mealLunch')
      case 'Abend':
        return t('mealDinner')
      case 'Snack':
        return t('mealSnack')
      case null:
        return t('mealOther')
      default:
        return slot
    }
  }

  return (
    <SectionCard
      title={t('dayView')}
      action={
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low disabled:opacity-30"
            aria-label={t('prevDay')}
          >
            <Icon name="chevron_left" size={20} />
          </button>
          <span className="text-xs font-medium text-on-surface tabular-nums w-24 text-center">
            {formatDate(day.date, locale)}
          </span>
          <button
            type="button"
            onClick={() => setIdx((i) => Math.min(days.length - 1, i + 1))}
            disabled={idx === days.length - 1}
            className="p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low disabled:opacity-30"
            aria-label={t('nextDay')}
          >
            <Icon name="chevron_right" size={20} />
          </button>
        </div>
      }
    >
      {day.isRefeed && (
        <span className="inline-block mb-3 text-[10px] font-label font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-tertiary/15 text-tertiary">
          {t('refeed')}
        </span>
      )}
      <div className="mb-4">
        <KcalCompare ist={day.actualKcal} soll={day.targetKcal} />
      </div>
      <MacroDonut
        actual={day.actual}
        target={day.target}
        centerValue={day.actualKcal != null ? String(Math.round(day.actualKcal)) : undefined}
        centerLabel="kcal"
      />
      {day.mealsBySlot.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {day.mealsBySlot.map((m) => (
            <li
              key={m.slot ?? '__none'}
              className="flex items-baseline justify-between gap-2 border-b border-outline-variant/10 pb-1.5 text-sm"
            >
              <span className="font-medium text-on-surface">{slotLabel(m.slot)}</span>
              <span className="tabular-nums font-semibold text-on-surface shrink-0">
                {m.kcal} kcal
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}

function WeekPanel({ week }: { week: CoachNutritionWeek }) {
  const t = useTranslations('Coach')
  return (
    <SectionCard
      title={t('weekView')}
      action={
        <span className="text-[10px] text-on-surface-variant">
          {t('avgPerLoggedDay')} · {week.daysWithData}/7
        </span>
      }
    >
      {week.daysWithData === 0 ? (
        <p className="text-sm text-on-surface-variant">{t('noData')}</p>
      ) : (
        <>
          <div className="mb-4">
            <KcalCompare ist={week.actualKcal} soll={week.targetKcal} />
          </div>
          <MacroDonut
            actual={week.actual}
            target={week.target}
            centerValue={week.actualKcal != null ? String(week.actualKcal) : undefined}
            centerLabel="Ø kcal"
          />
        </>
      )}
    </SectionCard>
  )
}

export function NutritionColumn({
  phase,
  days,
  week,
}: {
  phase: CoachDietPhase | null
  days: CoachNutritionDay[]
  week: CoachNutritionWeek
}) {
  const t = useTranslations('Coach')
  return (
    <section className="space-y-5">
      <h2 className="font-headline font-bold text-lg text-on-surface tracking-tight flex items-center gap-2">
        <Icon name="restaurant" size={20} className="text-primary" />
        {t('nutritionSection')}
      </h2>
      <DietPhaseCard phase={phase} />
      <DayPanel days={days} />
      <WeekPanel week={week} />
    </section>
  )
}
