export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getEntryBySlug } from '@/lib/journal'
import { JournalPost } from '@/components/journal/JournalPost'
import { SITE_NAME, SITE_URL, stripHtml } from '@/lib/site'

interface JournalPostPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: JournalPostPageProps): Promise<Metadata> {
  const entry = await getEntryBySlug(params.slug)
  if (!entry) return {}

  const description = entry.excerpt
    ? entry.excerpt
    : stripHtml(entry.content).slice(0, 160).trimEnd() + '…'

  const url = `${SITE_URL}/journal/${entry.slug}`
  const ogImage = entry.banner ? entry.banner : '/og-default.png'

  return {
    title: entry.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      siteName: SITE_NAME,
      title: entry.title,
      description,
      images: [{ url: ogImage, width: 1600, height: 700, alt: entry.title }],
      publishedTime: entry.date,
    },
    twitter: {
      card: 'summary_large_image',
      title: entry.title,
      description,
      images: [ogImage],
    },
  }
}

export default async function JournalPostPage({ params }: JournalPostPageProps) {
  const entry = await getEntryBySlug(params.slug)
  if (!entry) notFound()

  const url = `${SITE_URL}/journal/${entry.slug}`
  const description = entry.excerpt
    ? entry.excerpt
    : stripHtml(entry.content).slice(0, 160).trimEnd() + '…'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: entry.title,
    description,
    datePublished: entry.date,
    url,
    ...(entry.banner && { image: entry.banner }),
    author: {
      '@type': 'Person',
      name: 'Dominique Stampfli',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Blog',
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JournalPost entry={entry} />
    </>
  )
}
