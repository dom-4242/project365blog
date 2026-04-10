import type { Metadata } from 'next'
import { Playfair_Display, Lora } from 'next/font/google'
import { getLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import '@/styles/globals.css'
import { AuthSessionProvider } from '@/components/providers/SessionProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from '@/lib/site'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const lora = Lora({
  subsets: ['latin'],
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
    <html lang={locale} className={`${playfair.variable} ${lora.variable}`}>
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
