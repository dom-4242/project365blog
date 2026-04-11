import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import type { JournalEntryMeta } from '@/lib/journal'
import { getDayNumber } from '@/lib/journal'
import { getProjectStartDate } from '@/lib/project-config'
import { ReactionBarCompact } from '@/components/reactions/ReactionBarCompact'

interface JournalCardHomeProps {
  entry: JournalEntryMeta
}

export async function JournalCardHome({ entry }: JournalCardHomeProps) {
  const [locale, t, startDate] = await Promise.all([
    getLocale(),
    getTranslations('JournalCard'),
    getProjectStartDate(),
  ])

  const dayNumber = getDayNumber(entry.date, startDate)

  const formattedDate = new Date(entry.date).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <article className="group flex flex-col bg-surface-variant/40 backdrop-blur-xl border border-outline-variant/15 rounded-xl overflow-hidden hover:bg-surface-variant/60 transition-colors duration-150">
      <Link href={`/journal/${entry.slug}`} className="flex flex-col flex-1 p-5 gap-3">

        {/* Date + Day number */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-label font-bold tracking-widest uppercase text-outline">
            {t('day', { number: dayNumber })}
          </span>
          <span className="text-outline-variant/60" aria-hidden="true">·</span>
          <time className="text-xs font-label tracking-widest uppercase text-outline" dateTime={entry.date}>
            {formattedDate}
          </time>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-headline font-bold text-on-surface group-hover:text-primary transition-colors duration-150 line-clamp-2">
          {entry.title}
        </h2>

        {/* Excerpt */}
        {entry.excerpt ? (
          <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-3 flex-1">
            {entry.excerpt}
          </p>
        ) : (
          <div className="flex-1" />
        )}

      </Link>

      {/* Footer with reactions */}
      <div className="px-5 pb-4 pt-3 border-t border-outline-variant/10">
        <ReactionBarCompact slug={entry.slug} />
      </div>
    </article>
  )
}
