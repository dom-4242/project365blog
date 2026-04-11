import Link from 'next/link'
import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'
import type { JournalEntryMeta } from '@/lib/journal'
import { getDayNumber } from '@/lib/journal'
import { getProjectStartDate } from '@/lib/project-config'
import { HabitBadges } from './HabitBadges'
import { Icon } from '@/components/ui/Icon'

interface JournalCardProps {
  entry: JournalEntryMeta
}

export async function JournalCard({ entry }: JournalCardProps) {
  const [locale, t, startDate] = await Promise.all([
    getLocale(),
    getTranslations('JournalCard'),
    getProjectStartDate(),
  ])

  const excerpt = entry.excerpt ?? ''
  const dayNumber = getDayNumber(entry.date, startDate)

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <article className="group bg-surface-variant/40 backdrop-blur-xl border border-outline-variant/15 rounded-xl overflow-hidden hover:bg-surface-variant/60 transition-colors duration-150">
      <Link href={`/journal/${entry.slug}`} className="block">

        {entry.banner ? (
          <div className="relative w-full aspect-[16/7] bg-surface-container overflow-hidden">
            <Image
              src={entry.banner}
              alt={entry.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 800px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
          </div>
        ) : (
          <div className="relative px-6 pt-5 pb-0 overflow-hidden select-none bg-surface-container-low" aria-hidden="true">
            <span
              className="block font-headline font-bold leading-none text-surface-container-highest"
              style={{ fontSize: 'clamp(4.5rem, 18vw, 7.5rem)' }}
            >
              {String(dayNumber).padStart(2, '0')}
            </span>
          </div>
        )}

        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="font-label font-bold text-xs tracking-widest uppercase text-primary bg-primary/10 border border-primary/20 rounded px-2.5 py-0.5">
              {t('day', { number: dayNumber })}
            </span>
            <span className="text-outline-variant/60 select-none" aria-hidden="true">·</span>
            <time className="text-xs font-label text-on-surface-variant" dateTime={entry.date}>
              {formatDate(entry.date)}
            </time>
          </div>

          <h2 className="font-headline text-xl sm:text-2xl font-bold leading-snug text-on-surface group-hover:text-primary transition-colors duration-150">
            {entry.title}
          </h2>

          {excerpt && (
            <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">
              {excerpt}
            </p>
          )}

          <div className="flex items-center justify-between gap-4 pt-2 border-t border-outline-variant/10">
            <HabitBadges habits={entry.habits} />
            <span className="inline-flex items-center gap-1 text-xs font-label font-bold tracking-widest uppercase text-primary shrink-0 group-hover:gap-1.5 transition-all duration-150">
              {t('readMore')}
              <Icon name="arrow_forward" size={12} />
            </span>
          </div>
        </div>

      </Link>
    </article>
  )
}
