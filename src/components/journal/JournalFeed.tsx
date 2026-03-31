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
        <p className="font-display text-2xl text-sand-300 mb-2">{t('empty')}</p>
        <p className="text-sm text-sand-400">{t('emptyHint')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {entries.map((entry) => (
        <JournalCard key={entry.slug} entry={entry} />
      ))}
    </div>
  )
}
