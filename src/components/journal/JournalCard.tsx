import Link from 'next/link'
import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'
import type { JournalEntryMeta } from '@/lib/journal'
import { getDayNumber } from '@/lib/journal'
import { HabitBadges } from './HabitBadges'

interface JournalCardProps {
  entry: JournalEntryMeta
}

export async function JournalCard({ entry }: JournalCardProps) {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations('JournalCard'),
  ])

  const excerpt = entry.excerpt ?? ''
  const dayNumber = getDayNumber(entry.date)

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <article className="group bg-white dark:bg-[#2d2926] rounded-2xl border border-sand-200 dark:border-[#4a4540] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      <Link href={`/journal/${entry.slug}`} className="block">

        {entry.banner ? (
          <div className="relative w-full aspect-[16/7] bg-sand-100 dark:bg-[#3a3531]">
            <Image
              src={entry.banner}
              alt={entry.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
        ) : (
          <div className="relative px-6 pt-5 pb-0 overflow-hidden select-none" aria-hidden="true">
            <span
              className="block font-display font-bold leading-none text-sand-100 dark:text-[#3a3531]"
              style={{ fontSize: 'clamp(4.5rem, 18vw, 7.5rem)' }}
            >
              {String(dayNumber).padStart(2, '0')}
            </span>
          </div>
        )}

        <div className="px-6 py-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="font-display font-bold text-xs tracking-widest uppercase text-sand-400 border border-sand-200 dark:border-[#4a4540] rounded px-1.5 py-0.5">
              {t('day', { number: dayNumber })}
            </span>
            <span className="text-sand-300 dark:text-[#4a4540] select-none" aria-hidden="true">·</span>
            <time className="text-xs text-sand-400" dateTime={entry.date}>
              {formatDate(entry.date)}
            </time>
          </div>

          <h2 className="font-display text-xl sm:text-2xl font-bold leading-snug text-[#1a1714] dark:text-[#faf9f7] group-hover:text-nutrition-700 dark:group-hover:text-nutrition-400 transition-colors duration-200">
            {entry.title}
          </h2>

          {excerpt && (
            <p className="text-sm text-[#6b6560] dark:text-[#9a9088] leading-relaxed line-clamp-3">
              {excerpt}
            </p>
          )}

          <div className="flex items-center justify-between gap-4 pt-1 border-t border-sand-100 dark:border-[#3a3531]">
            <HabitBadges habits={entry.habits} />
            <span className="text-xs font-semibold text-nutrition-600 dark:text-nutrition-400 group-hover:text-nutrition-700 shrink-0 transition-colors">
              {t('readMore')}
            </span>
          </div>
        </div>

      </Link>
    </article>
  )
}
