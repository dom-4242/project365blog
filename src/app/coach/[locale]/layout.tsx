import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { routing } from '@/i18n/routing'
import { getAuthSession } from '@/lib/auth'
import { CoachHeader } from '@/components/coach/CoachHeader'

interface CoachLayoutProps {
  children: React.ReactNode
  params: { locale: string }
}

export const dynamic = 'force-dynamic'

async function loadMessages(locale: string) {
  return (await import(`../../../../messages/${locale}.json`)).default
}

export default async function CoachLayout({ children, params: { locale } }: CoachLayoutProps) {
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound()
  }

  const [messages, session] = await Promise.all([loadMessages(locale), getAuthSession()])

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="min-h-screen bg-background text-on-surface">
        <CoachHeader userName={session?.user?.name} />
        <main className="max-w-[1600px] mx-auto px-6 py-8">{children}</main>
      </div>
    </NextIntlClientProvider>
  )
}
