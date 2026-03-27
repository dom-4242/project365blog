import Link from 'next/link'
import Image from 'next/image'
import type { JournalEntryMeta } from '@/lib/journal'
import { getExcerpt, getDayNumber, getEntryBySlug } from '@/lib/journal'
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
    <article className="group bg-white rounded-2xl border border-sand-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      <Link href={`/journal/${entry.slug}`} className="block">

        {entry.banner ? (
          <div className="relative w-full aspect-[16/7] bg-sand-100">
            <Image
              src={entry.banner}
              alt={entry.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
        ) : (
          /* Kein Banner: Tagnummer als dekoratives Typografie-Element */
          <div className="relative px-6 pt-5 pb-0 overflow-hidden select-none" aria-hidden="true">
            <span
              className="block font-display font-bold leading-none text-sand-100"
              style={{ fontSize: 'clamp(4.5rem, 18vw, 7.5rem)' }}
            >
              {String(dayNumber).padStart(2, '0')}
            </span>
          </div>
        )}

        <div className="px-6 py-5 space-y-3">
          {/* Eyebrow: Tag + Datum */}
          <div className="flex items-center gap-2.5">
            <span className="font-display font-bold text-xs tracking-widest uppercase text-sand-400 border border-sand-200 rounded px-1.5 py-0.5">
              Tag {dayNumber}
            </span>
            <span className="text-sand-300 select-none" aria-hidden="true">·</span>
            <time className="text-xs text-sand-400" dateTime={entry.date}>
              {formatDate(entry.date)}
            </time>
          </div>

          {/* Titel */}
          <h2 className="font-display text-xl sm:text-2xl font-bold leading-snug text-[#1a1714] group-hover:text-nutrition-700 transition-colors duration-200">
            {entry.title}
          </h2>

          {/* Excerpt */}
          {excerpt && (
            <p className="text-sm text-[#6b6560] leading-relaxed line-clamp-3">
              {excerpt}
            </p>
          )}

          {/* Habits + Weiterlesen */}
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-sand-100">
            <HabitBadges habits={entry.habits} />
            <span className="text-xs font-semibold text-nutrition-600 group-hover:text-nutrition-700 shrink-0 transition-colors">
              Weiterlesen →
            </span>
          </div>
        </div>

      </Link>
    </article>
  )
}
