import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllEntries, getEntryBySlug } from '@/lib/journal'

interface JournalPostPageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  const entries = getAllEntries()
  return entries.map((entry) => ({ slug: entry.slug }))
}

export async function generateMetadata({ params }: JournalPostPageProps): Promise<Metadata> {
  const entry = getEntryBySlug(params.slug)
  if (!entry) return {}
  return {
    title: `${entry.title} — Project 365`,
    openGraph: {
      title: entry.title,
      images: entry.banner ? [entry.banner] : [],
    },
  }
}

export default function JournalPostPage({ params }: JournalPostPageProps) {
  const entry = getEntryBySlug(params.slug)
  if (!entry) notFound()

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <header className="mb-10">
        {entry.banner && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.banner}
            alt={entry.title}
            className="w-full rounded-xl mb-8 object-cover max-h-80"
          />
        )}
        <time className="text-sm text-gray-500" dateTime={entry.date}>
          {new Date(entry.date).toLocaleDateString('de-CH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
        <h1 className="text-3xl font-bold mt-2 mb-4">{entry.title}</h1>
        {entry.tags && entry.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <li
                key={tag}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </header>
      <div className="prose prose-neutral max-w-none">
        <MDXRemote source={entry.content} />
      </div>
    </article>
  )
}
