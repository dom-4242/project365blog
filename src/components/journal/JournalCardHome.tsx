import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import type { JournalEntryMeta } from '@/lib/journal'
import { getDayNumber, isPerfectDay } from '@/lib/journal'
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
  const perfect = isPerfectDay(entry.habits)

  const formattedDate = new Date(entry.date).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <article className={`group flex flex-col backdrop-blur-xl rounded-xl overflow-hidden transition-colors duration-150 ${
      perfect
        ? 'bg-primary/5 border border-primary/40 hover:bg-primary/10 shadow-[0_0_24px_rgba(255,143,112,0.08)]'
        : 'bg-surface-variant/40 border border-outline-variant/15 hover:bg-surface-variant/60'
    }`}>
      <Link href={`/journal/${entry.slug}`} className="flex flex-col flex-1 p-5 gap-3">

        {/* Date + Day number */}
        <div className="flex items-center gap-2">
          {perfect && (
            <span className="inline-flex items-center gap-1 text-[10px] font-label font-bold tracking-widest uppercase text-primary bg-primary/10 border border-primary/20 rounded px-2 py-0.5 mr-1">
              ✦ {t('perfectDay')}
            </span>
          )}
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
