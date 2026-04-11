import { useTranslations } from 'next-intl'
import type { JournalEntryMeta } from '@/lib/journal'
import { JournalCard } from './JournalCard'

interface JournalFeedProps {
  entries: JournalEntryMeta[]
}

export function JournalFeed({ entries }: JournalFeedProps) {
  const t = useTranslations('JournalFeed')

  if (entries.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="font-headline text-2xl text-outline mb-2">{t('empty')}</p>
        <p className="text-sm text-on-surface-variant">{t('emptyHint')}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {entries.map((entry) => (
        <JournalCard key={entry.slug} entry={entry} />
      ))}
    </div>
  )
}
