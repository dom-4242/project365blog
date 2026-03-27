import Image from 'next/image'
import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import type { JournalEntry } from '@/lib/journal'
import { getDayNumber } from '@/lib/journal'
import { HabitBadges } from './HabitBadges'

interface JournalPostProps {
  entry: JournalEntry
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-CH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function JournalPost({ entry }: JournalPostProps) {
  const dayNumber = getDayNumber(entry.date)

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Banner */}
      {entry.banner && (
        <div className="relative w-full aspect-[16/7] rounded-2xl overflow-hidden mb-10 bg-sand-100">
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

      {/* Header */}
      <header className="mb-10 space-y-4">
        <div className="flex items-center gap-3 text-sm text-sand-500">
          <span className="font-medium tracking-widest uppercase text-xs">
            Tag {dayNumber}
          </span>
          <span className="text-sand-300 select-none">·</span>
          <time dateTime={entry.date}>{formatDate(entry.date)}</time>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight text-[#1a1714]">
          {entry.title}
        </h1>

        <HabitBadges habits={entry.habits} />

        {entry.tags && entry.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2 pt-1">
            {entry.tags.map((tag) => (
              <li
                key={tag}
                className="text-xs px-2.5 py-1 bg-sand-100 text-sand-500 rounded-full"
              >
                #{tag}
              </li>
            ))}
          </ul>
        )}
      </header>

      {/* MDX Content */}
      <div className="prose prose-stone prose-lg max-w-none">
        <MDXRemote source={entry.content} />
      </div>

      {/* Back link */}
      <footer className="mt-16 pt-8 border-t border-sand-200">
        <Link
          href="/"
          className="text-sm text-nutrition-700 hover:underline font-medium"
        >
          ← Zurück zum Journal
        </Link>
      </footer>
    </article>
  )
}
