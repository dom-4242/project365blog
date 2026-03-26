import Link from 'next/link'
import { Navigation } from './Navigation'

export function Header() {
  return (
    <header className="border-b border-sand-200 bg-sand-50/90 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-xl font-bold tracking-tight text-[#1a1714]">
          Project 365
        </Link>
        <Navigation />
      </div>
    </header>
  )
}
