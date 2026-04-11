import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Icon } from '@/components/ui/Icon'
import { SITE_URL, buildAlternates, OG_LOCALE } from '@/lib/site'

interface AboutPageProps {
  params: { locale: string }
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const t = await getTranslations('AboutPage')
  const canonicalUrl = `${SITE_URL}/${params.locale}/about`
  const ogLocale = OG_LOCALE[params.locale] ?? OG_LOCALE.de

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      ...buildAlternates(`${SITE_URL}/de/about`, `${SITE_URL}/en/about`, `${SITE_URL}/pt/about`),
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title: t('metaTitle'),
      description: t('metaDescription'),
      locale: ogLocale,
    },
  }
}

const PILLARS = [
  { key: 'pillar1', icon: 'directions_run' },
  { key: 'pillar2', icon: 'restaurant' },
  { key: 'pillar3', icon: 'smoking_rooms' },
] as const

const FINALE_ITEMS = ['finaleItem1', 'finaleItem2', 'finaleItem3', 'finaleItem4'] as const

export default async function AboutPage({ params }: AboutPageProps) {
  const t = await getTranslations('AboutPage')

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-16">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-primary/20 bg-primary/5">
          <span className="text-xs font-label font-bold tracking-widest uppercase text-primary">
            {t('badge')}
          </span>
        </div>
        <h1 className="font-headline font-bold tracking-tighter leading-none text-5xl sm:text-6xl text-on-surface">
          {t('headline')}
        </h1>
        <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed max-w-2xl">
          {t('intro')}
        </p>
      </section>

      {/* ── Was ist Project 365? ──────────────────────────────────────── */}
      <section className="bg-surface-variant/40 backdrop-blur-xl border border-outline-variant/15 rounded-xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <Icon name="calendar_month" size={20} className="text-primary" />
          <h2 className="text-xs font-label font-bold tracking-widest uppercase text-primary">
            {t('whatTitle')}
          </h2>
        </div>
        <p className="text-on-surface-variant leading-relaxed">
          {t('whatText')}
        </p>
      </section>

      {/* ── Die drei Säulen ──────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant">
          {t('pillarsTitle')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PILLARS.map(({ key, icon }) => (
            <div
              key={key}
              className="bg-surface-container border border-outline-variant/15 rounded-xl p-5 space-y-3"
            >
              <Icon name={icon} size={20} className="text-primary" />
              <h3 className="font-headline font-bold text-on-surface">
                {t(`${key}Title`)}
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {t(`${key}Text`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Das grosse Finale ─────────────────────────────────────────── */}
      <section className="bg-primary/5 border border-primary/20 rounded-xl p-6 sm:p-8 space-y-5">
        <div className="space-y-1">
          <p className="text-xs font-label font-bold tracking-widest uppercase text-primary">
            {t('finaleTitle')}
          </p>
          <h2 className="text-2xl font-headline font-bold text-on-surface">
            {t('finaleSubtitle')}
          </h2>
        </div>
        <p className="text-on-surface-variant leading-relaxed">
          {t('finaleText')}
        </p>
        <ul className="space-y-2">
          {FINALE_ITEMS.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <Icon name="check_circle" size={16} className="text-primary mt-0.5 flex-none" />
              <span className="text-sm text-on-surface-variant">{t(item)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Warum öffentlich? ─────────────────────────────────────────── */}
      <section className="bg-surface-variant/40 backdrop-blur-xl border border-outline-variant/15 rounded-xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <Icon name="public" size={20} className="text-primary" />
          <h2 className="text-xs font-label font-bold tracking-widest uppercase text-primary">
            {t('whyTitle')}
          </h2>
        </div>
        <p className="text-on-surface-variant leading-relaxed">
          {t('whyText')}
        </p>
      </section>

      {/* ── CTA zum Journal ───────────────────────────────────────────── */}
      <div className="pt-4 border-t border-outline-variant/15 flex justify-center">
        <Link
          href={`/${params.locale}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-label font-bold tracking-widest uppercase text-xs rounded hover:bg-primary-container transition-colors"
        >
          <Icon name="article" size={14} />
          {t('ctaJournal')}
        </Link>
      </div>

    </div>
  )
}
