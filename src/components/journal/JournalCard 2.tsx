import Link from 'next/link'
import Image from 'next/image'
import type { JournalEntryMeta } from '@/lib/journal'
import { getExcerpt, getDayNumber } from '@/lib/journal'
import { getEntryBySlug } from '@/lib/journal'
import { HabitBadges } from './HabitBadges'

interface JournalCardProps {
  entry: JournalEntryMeta
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-CH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function JournalCard({ entry }: JournalCardProps) {
  const full = getEntryBySlug(entry.slug)
  const excerpt = full ? getExcerpt(full.content) : ''
  const dayNumber = getDayNumber(entry.date)

  return (
    <article className="group">
      <Link href={`/journal/${entry.slug}`} className="block">
        {entry.banner && (
          <div className="relative w-full aspect-[16/7] rounded-xl overflow-hidden mb-5 bg-sand-100">
            <Image
              src={entry.banner}
              alt={entry.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium tracking-widest uppercase text-sand-500">
              Tag {dayNumber}
            </span>
            <span className="text-sand-300 select-none">·</span>
            <time className="text-xs text-sand-500" dateTime={entry.date}>
              {formatDate(entry.date)}
            </time>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold leading-snug text-[#1a1714] group-hover:text-nutrition-700 transition-colors">
            {entry.title}
          </h2>
          {excerpt && (
            <p className="text-[#6b6560] leading-relaxed line-clamp-3">{excerpt}</p>
          )}
          <div className="flex items-center justify-between pt-1">
            <HabitBadges habits={entry.habits} />
            <span className="text-sm text-nutrition-700 font-medium group-hover:underline">
              Weiterlesen →
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}
