export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getAllEntriesForLocale } from '@/lib/journal'
import { JournalFeed } from '@/components/journal/JournalFeed'
import { Icon } from '@/components/ui/Icon'
import { SITE_NAME, buildLocaleMetadata } from '@/lib/site'

interface JournalPageProps {
  params: { locale: string }
}

export async function generateMetadata({ params }: JournalPageProps): Promise<Metadata> {
  const { locale } = params
  const t = await getTranslations({ locale, namespace: 'JournalPage' })

  return buildLocaleMetadata({
    locale,
    path: '/journal',
    title: `${t('title')} — ${SITE_NAME}`,
    description: t('description'),
  })
}

export default async function JournalPage({ params }: JournalPageProps) {
  const [entries, t] = await Promise.all([
    getAllEntriesForLocale(params.locale),
    getTranslations('JournalPage'),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

      {/* Page header */}
      <header className="mb-10">
        <Link
          href={`/${params.locale}`}
          className="inline-flex items-center gap-1.5 text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant hover:text-on-surface transition-colors group mb-6"
        >
          <Icon name="arrow_back" size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          {t('backHome')}
        </Link>

        <h1 className="font-headline font-bold tracking-tighter text-4xl sm:text-5xl text-on-surface mb-3">
          {t('title')}
        </h1>
        <p className="text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant">
          {t('entryCount', { count: entries.length })}
        </p>
      </header>

      <JournalFeed entries={entries} />

    </div>
  )
}
