import Link from 'next/link'
import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'
import type { JournalEntryMeta } from '@/lib/journal'
import { getDayNumber } from '@/lib/journal'
import { getProjectStartDate } from '@/lib/project-config'
import { isMovementFulfilled, isNutritionFulfilled, isSmokingFulfilled } from '@/lib/habits'
import { ReactionBarCompact } from '@/components/reactions/ReactionBarCompact'

interface JournalCardCompactProps {
  entry: JournalEntryMeta
}

export async function JournalCardCompact({ entry }: JournalCardCompactProps) {
  const [locale, t, startDate] = await Promise.all([
    getLocale(),
    getTranslations('JournalCard'),
    getProjectStartDate(),
  ])

  const dayNumber = getDayNumber(entry.date, startDate)

  const movementOk = isMovementFulfilled(entry.habits.movement)
  const nutritionOk = isNutritionFulfilled(entry.habits.nutrition)
  const smokingOk = isSmokingFulfilled(entry.habits.smoking)
  const allOk = movementOk && nutritionOk && smokingOk

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <article className="group">
      <Link
        href={`/journal/${entry.slug}`}
        className="flex items-center gap-4 px-4 pt-3 pb-2 rounded-t-xl hover:bg-sand-100 dark:hover:bg-ctp-surface0 transition-colors duration-150"
      >
        {/* Thumbnail */}
        <div className="relative flex-none w-14 h-14 rounded-lg overflow-hidden bg-ctp-surface0">
          {entry.banner ? (
            <Image
              src={entry.banner}
              alt={entry.title}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <span
              className="absolute inset-0 flex items-center justify-center font-display font-bold text-sand-300 dark:text-ctp-surface2 text-sm"
            >
              {String(dayNumber).padStart(2, '0')}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-medium text-sand-400 tabular-nums">
              {t('day', { number: dayNumber })}
            </span>
            <span className="text-sand-300 dark:text-ctp-surface2" aria-hidden="true">·</span>
            <time className="text-xs text-sand-400" dateTime={entry.date}>
              {formatDate(entry.date)}
            </time>
            {/* Habit status dot */}
            <span
              className={`ml-auto flex-none w-2 h-2 rounded-full ${allOk ? 'bg-movement-500' : 'bg-sand-300 dark:bg-ctp-surface2'}`}
              title={allOk ? 'Alle Ziele erfüllt' : 'Ziele nicht alle erfüllt'}
            />
          </div>
          <h2 className="text-sm font-semibold text-ctp-text line-clamp-1 group-hover:text-ctp-peach transition-colors">
            {entry.title}
          </h2>
        </div>
      </Link>

      {/* Reactions — outside the Link to prevent navigation on click */}
      <div className="px-4 pb-2 pl-[4.5rem]">
        <ReactionBarCompact slug={entry.slug} />
      </div>
    </article>
  )
}
