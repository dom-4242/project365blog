import { useTranslations } from 'next-intl'
import { Icon } from '@/components/ui/Icon'

interface Props {
  /** kcal SOLL/IST — nur öffentlich, wenn der Owner den Schalter aktiviert hat. */
  kcal?: { soll: number; ist: number } | null
  className?: string
}

/**
 * Öffentliche kcal-SOLL/IST-Anzeige (N-11). Bewusst nur die kcal-Ebene —
 * niemals Makros, Mikros oder Mahlzeit-Details. Rendert nichts, wenn keine
 * Daten freigegeben sind.
 */
export function NutritionKcal({ kcal, className }: Props) {
  const t = useTranslations('NutritionKcal')
  if (!kcal) return null

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-label tracking-widest uppercase px-2.5 py-1 rounded-full border bg-surface-container border-outline-variant/20 text-on-surface-variant ${className ?? ''}`}
      title={t('title')}
    >
      <Icon name="local_fire_department" size={14} />
      <span className="tabular-nums text-on-surface-variant">
        {t('soll')} <span className="font-bold text-on-surface">{kcal.soll}</span>
      </span>
      <span className="text-outline-variant/60" aria-hidden="true">·</span>
      <span className="tabular-nums text-on-surface-variant">
        {t('ist')} <span className="font-bold text-on-surface">{kcal.ist}</span>
      </span>
      <span className="text-on-surface-variant lowercase">kcal</span>
    </span>
  )
}
