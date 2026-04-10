import type { Metadata } from 'next'
import { Space_Grotesk, Manrope } from 'next/font/google'
import { getLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import '@/styles/globals.css'
import { AuthSessionProvider } from '@/components/providers/SessionProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from '@/lib/site'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-headline',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Tägliches Journal`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Tägliches Journal`,
    description: SITE_DESCRIPTION,
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Tägliches Journal`,
    description: SITE_DESCRIPTION,
    images: ['/og-default.png'],
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: SITE_URL,
    types: { 'application/rss+xml': `${SITE_URL}/feed.xml` },
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const [locale, headersList] = await Promise.all([getLocale(), headers()])
  const nonce = headersList.get('x-nonce') ?? undefined
  return (
    <html lang={locale} className={`${spaceGrotesk.variable} ${manrope.variable}`}>
      {/* Material Symbols Outlined — loaded from Google Fonts CDN (not in next/font)
          CSP updated to allow fonts.googleapis.com + fonts.gstatic.com */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-surface font-body antialiased">
        <ThemeProvider nonce={nonce}>
          <AuthSessionProvider>
            {children}
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
