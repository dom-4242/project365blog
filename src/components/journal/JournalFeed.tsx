import type { JournalEntryMeta } from '@/lib/journal'
import { JournalCard } from './JournalCard'

interface JournalFeedProps {
  entries: JournalEntryMeta[]
}

export function JournalFeed({ entries }: JournalFeedProps) {
  if (entries.length === 0) {
    return (
      <div className="py-20 text-center text-sand-400">
        <p className="font-display text-2xl mb-2">Noch keine Einträge</p>
        <p className="text-sm">Die ersten Einträge folgen bald.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-sand-200">
      {entries.map((entry) => (
        <div key={entry.slug} className="py-12 first:pt-0">
          <JournalCard entry={entry} />
        </div>
      ))}
    </div>
  )
}
