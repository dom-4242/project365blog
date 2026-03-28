export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getEntryBySlug } from '@/lib/journal'
import { JournalPost } from '@/components/journal/JournalPost'

interface JournalPostPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: JournalPostPageProps): Promise<Metadata> {
  const entry = await getEntryBySlug(params.slug)
  if (!entry) return {}
  return {
    title: `${entry.title} — Project 365`,
    openGraph: {
      title: entry.title,
      images: entry.banner ? [entry.banner] : [],
    },
  }
}

export default async function JournalPostPage({ params }: JournalPostPageProps) {
  const entry = await getEntryBySlug(params.slug)
  if (!entry) notFound()

  return <JournalPost entry={entry} />
}
