import Image from 'next/image'
import Link from 'next/link'
import { getTranslations, getLocale } from 'next-intl/server'
import type { JournalEntry } from '@/lib/journal'
import { getDayNumber } from '@/lib/journal'
import { getProjectStartDate } from '@/lib/project-config'
import { HabitBadges } from './HabitBadges'
import { ReactionBar } from '@/components/reactions/ReactionBar'
import { Icon } from '@/components/ui/Icon'
import { getAuthSession } from '@/lib/auth'

interface JournalPostProps {
  entry: JournalEntry
  isTranslated?: boolean
}

export async function JournalPost({ entry, isTranslated = false }: JournalPostProps) {
  const [session, t, locale, startDate] = await Promise.all([
    getAuthSession(),
    getTranslations('JournalPost'),
    getLocale(),
    getProjectStartDate(),
  ])
  const isAdmin = !!session?.user?.isAdmin
  const dayNumber = getDayNumber(entry.date, startDate)

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const metaRow = (
    <div className="flex items-center flex-wrap gap-2.5">
      <span className="font-label font-bold text-xs tracking-widest uppercase text-primary bg-primary/10 border border-primary/20 rounded px-2.5 py-1">
        {t('day', { number: dayNumber })}
      </span>
      <span className="text-outline-variant/60 select-none" aria-hidden="true">·</span>
      <time className="text-sm font-label text-on-surface-variant" dateTime={entry.date}>
        {formatDate(entry.date)}
      </time>
      {isAdmin && (
        <>
          <span className="text-outline-variant/60 select-none" aria-hidden="true">·</span>
          <Link
            href={`/admin/entries/${entry.id}/edit`}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {t('edit')}
          </Link>
        </>
      )}
    </div>
  )

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {entry.banner ? (
        <div className="relative w-full aspect-[16/7] rounded-xl overflow-hidden mb-8 bg-surface-container">
          <Image
            src={entry.banner}
            alt={entry.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 672px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            {metaRow}
            <h1 className="font-headline text-3xl sm:text-4xl font-bold leading-tight text-on-surface mt-3">
              {entry.title}
            </h1>
          </div>
        </div>
      ) : (
        <header className="mb-8">
          {metaRow}
          <h1 className="font-headline text-3xl sm:text-4xl font-bold leading-tight text-on-surface mt-4">
            {entry.title}
          </h1>
        </header>
      )}

      <div className="flex flex-col gap-3 mb-8">
        <HabitBadges habits={entry.habits} />
        {entry.tags && entry.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <li
                key={tag}
                className="text-xs px-2.5 py-1 bg-surface-variant/40 border border-outline-variant/15 text-on-surface-variant rounded-full backdrop-blur-sm"
              >
                #{tag}
              </li>
            ))}
          </ul>
        )}
      </div>

      <hr className="border-outline-variant/20 mb-8" />

      <div
        className="prose prose-stone prose-lg max-w-none prose-invert"
        dangerouslySetInnerHTML={{ __html: entry.content }}
      />

      <div className="mt-14 pt-8 border-t border-outline-variant/20">
        <ReactionBar slug={entry.slug} />
      </div>

      <footer className="mt-8 pt-6 border-t border-outline-variant/15 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors group"
        >
          <Icon name="arrow_back" size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          {t('back')}
        </Link>
        {isTranslated && (
          <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
            <Icon name="translate" size={14} />
            {t('aiTranslated')}
          </span>
        )}
      </footer>
    </article>
  )
}
