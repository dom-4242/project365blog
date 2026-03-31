import Image from 'next/image'
import Link from 'next/link'
import { getTranslations, getLocale } from 'next-intl/server'
import type { JournalEntry } from '@/lib/journal'
import { getDayNumber } from '@/lib/journal'
import { HabitBadges } from './HabitBadges'
import { ReactionBar } from '@/components/reactions/ReactionBar'
import { getAuthSession } from '@/lib/auth'

interface JournalPostProps {
  entry: JournalEntry
}

export async function JournalPost({ entry }: JournalPostProps) {
  const [session, t, locale] = await Promise.all([
    getAuthSession(),
    getTranslations('JournalPost'),
    getLocale(),
  ])
  const isAdmin = !!session?.user?.isAdmin
  const dayNumber = getDayNumber(entry.date)

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {entry.banner && (
        <div className="relative w-full aspect-[16/7] rounded-2xl overflow-hidden mb-10 bg-sand-100 dark:bg-[#3a3531]">
          <Image
            src={entry.banner}
            alt={entry.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 672px"
          />
        </div>
      )}

      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="font-display font-bold text-xs tracking-widest uppercase text-sand-400 border border-sand-200 dark:border-[#4a4540] rounded px-2 py-0.5">
            {t('day', { number: dayNumber })}
          </span>
          <span className="text-sand-300 dark:text-[#4a4540] select-none" aria-hidden="true">·</span>
          <time className="text-sm text-sand-400" dateTime={entry.date}>
            {formatDate(entry.date)}
          </time>
          {isAdmin && (
            <>
              <span className="text-sand-300 dark:text-[#4a4540] select-none" aria-hidden="true">·</span>
              <Link
                href={`/admin/entries/${entry.id}/edit`}
                className="text-xs font-medium text-nutrition-600 dark:text-nutrition-500 hover:text-nutrition-700 dark:hover:text-nutrition-400 transition-colors"
              >
                {t('edit')}
              </Link>
            </>
          )}
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight text-[#1a1714] dark:text-[#faf9f7] mb-5">
          {entry.title}
        </h1>

        <HabitBadges habits={entry.habits} />

        {entry.tags && entry.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2 mt-3">
            {entry.tags.map((tag) => (
              <li
                key={tag}
                className="text-xs px-2.5 py-1 bg-sand-100 dark:bg-[#3a3531] text-sand-500 rounded-full"
              >
                #{tag}
              </li>
            ))}
          </ul>
        )}
      </header>

      <hr className="border-sand-200 dark:border-[#4a4540] mb-10" />

      <div
        className="prose prose-stone prose-lg max-w-none prose-dropcap dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: entry.content }}
      />

      <div className="mt-14 pt-8 border-t border-sand-200 dark:border-[#4a4540]">
        <ReactionBar slug={entry.slug} />
      </div>

      <footer className="mt-8 pt-6 border-t border-sand-100 dark:border-[#3a3531]">
        <Link
          href="/"
          className="text-sm font-medium text-nutrition-700 dark:text-nutrition-400 hover:text-nutrition-600 transition-colors"
        >
          {t('back')}
        </Link>
      </footer>
    </article>
  )
}
