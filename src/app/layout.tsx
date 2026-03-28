import type { Metadata } from 'next'
import { Playfair_Display, Lora } from 'next/font/google'
import '@/styles/globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AuthSessionProvider } from '@/components/providers/SessionProvider'

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
  title: 'Project 365 — Tägliches Journal',
  description:
    'Ein öffentliches 365-Tage-Projekt: Tägliche Einträge, Habit-Tracking und Metriken-Visualisierung.',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="de" className={`${playfair.variable} ${lora.variable}`}>
      <body className="bg-sand-50 text-[#2d2926] font-body antialiased">
        <AuthSessionProvider>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </AuthSessionProvider>
      </body>
    </html>
  )
}
