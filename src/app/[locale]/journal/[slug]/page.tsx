export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getEntryBySlugWithTranslation } from '@/lib/journal'
import { JournalPost } from '@/components/journal/JournalPost'
import { SITE_NAME, SITE_URL, stripHtml } from '@/lib/site'

interface JournalPostPageProps {
  params: {
    locale: string
    slug: string
  }
}

export async function generateMetadata({ params }: JournalPostPageProps): Promise<Metadata> {
  const result = await getEntryBySlugWithTranslation(params.slug)
  if (!result) return {}

  const { entry, translation } = result
  const useTranslation = params.locale === 'en' && translation !== null
  const title = useTranslation ? translation!.title : entry.title
  const excerptSource = useTranslation ? (translation!.excerpt || translation!.title) : (entry.excerpt ?? '')
  const description = excerptSource || stripHtml(entry.content).slice(0, 160).trimEnd() + '…'

  const url = `${SITE_URL}/${params.locale}/journal/${entry.slug}`
  const ogImage = entry.banner ? entry.banner : '/og-default.png'

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: ogImage, width: 1600, height: 700, alt: title }],
      publishedTime: entry.date,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function JournalPostPage({ params }: JournalPostPageProps) {
  const result = await getEntryBySlugWithTranslation(params.slug)
  if (!result) notFound()

  const { entry, translation } = result
  const useTranslation = params.locale === 'en' && translation !== null

  const displayEntry = useTranslation
    ? { ...entry, title: translation!.title, content: translation!.content, excerpt: translation!.excerpt || entry.excerpt }
    : entry

  const url = `${SITE_URL}/${params.locale}/journal/${entry.slug}`
  const description = displayEntry.excerpt
    ? displayEntry.excerpt
    : stripHtml(entry.content).slice(0, 160).trimEnd() + '…'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: displayEntry.title,
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
      <JournalPost entry={displayEntry} isTranslated={useTranslation} />
    </>
  )
}
