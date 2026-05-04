import type { Metadata } from 'next'

export const SITE_NAME = 'Project 365'

export const SITE_DESCRIPTION =
  'Ein öffentliches 365-Tage-Projekt: Tägliche Einträge über Bewegung, Ernährung und den Weg zum Rauchstopp — mit echten Zahlen, guten und schlechten Tagen.'

export const SITE_DESCRIPTION_EN =
  'A public 365-day project: Daily entries about movement, nutrition and the journey to quit smoking — with real numbers, good days and bad.'

export const SITE_DESCRIPTION_PT =
  'Um projeto público de 365 dias: entradas diárias sobre movimento, alimentação e o caminho para parar de fumar — com números reais, bons e maus dias.'

// Trailing slash deliberately stripped
export const SITE_URL = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '')

/** Strip HTML tags and collapse whitespace — used to derive meta descriptions from rich-text content. */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Build hreflang `alternates.languages` for Next.js metadata.
 * Always includes DE (default) and x-default. EN and PT are optional.
 */
export function buildAlternates(deUrl: string, enUrl?: string, ptUrl?: string) {
  const languages: Record<string, string> = {
    de: deUrl,
    'x-default': deUrl,
  }
  if (enUrl) languages.en = enUrl
  if (ptUrl) languages['pt-BR'] = ptUrl
  return { canonical: deUrl, languages }
}

/** Map locale code to Open Graph locale string */
export const OG_LOCALE: Record<string, string> = {
  de: 'de_CH',
  en: 'en_US',
  pt: 'pt_BR',
}

export type OgImage = {
  url: string
  width?: number
  height?: number
  alt?: string
}

const DEFAULT_OG_IMAGE: OgImage = {
  url: '/og-default.png',
  width: 1200,
  height: 630,
  alt: SITE_NAME,
}

/**
 * Single source of truth for locale-aware page metadata. Produces a Metadata
 * block with title, description, openGraph, twitter, and alternates all set
 * consistently. Every locale-routed page should call this so social cards and
 * hreflang stay in sync across DE/EN/PT.
 *
 * `path` is the locale-agnostic route (e.g. '', '/journal', '/journal/some-slug').
 * Passing the leading locale segment is the caller's bug — don't.
 */
export function buildLocaleMetadata(opts: {
  locale: string
  /** Route path WITHOUT the leading `/{locale}` segment. Use '' for the home page. */
  path?: string
  title: string
  description: string
  type?: 'website' | 'article'
  images?: OgImage[]
  publishedTime?: string
}): Metadata {
  const { locale, path = '', title, description, type = 'website', images, publishedTime } = opts
  const safePath = path === '' || path.startsWith('/') ? path : `/${path}`
  const canonicalUrl = `${SITE_URL}/${locale}${safePath}`
  const ogLocale = OG_LOCALE[locale] ?? OG_LOCALE.de
  const alternateLocale = Object.entries(OG_LOCALE)
    .filter(([code]) => code !== locale)
    .map(([, og]) => og)
  const ogImages = images ?? [DEFAULT_OG_IMAGE]

  return {
    title: { absolute: title },
    description,
    alternates: {
      ...buildAlternates(
        `${SITE_URL}/de${safePath}`,
        `${SITE_URL}/en${safePath}`,
        `${SITE_URL}/pt${safePath}`,
      ),
      canonical: canonicalUrl,
    },
    openGraph: {
      type,
      url: canonicalUrl,
      siteName: SITE_NAME,
      title,
      description,
      locale: ogLocale,
      alternateLocale,
      images: ogImages,
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImages.map((img) => img.url),
    },
  }
}
