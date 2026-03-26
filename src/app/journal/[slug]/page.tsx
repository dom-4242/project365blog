import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getAllEntries, getEntryBySlug } from '@/lib/journal'
import { JournalPost } from '@/components/journal/JournalPost'

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

  return <JournalPost entry={entry} />
}
