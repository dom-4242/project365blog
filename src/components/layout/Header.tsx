import Link from 'next/link'
import { Navigation } from './Navigation'

export function Header() {
  return (
    <header className="border-b border-sand-200 bg-sand-50/95 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-2">
          <span className="font-display text-lg font-bold tracking-tight text-[#1a1714] group-hover:text-nutrition-700 transition-colors">
            Project <span className="text-nutrition-600">365</span>
          </span>
        </Link>
        <Navigation />
      </div>
    </header>
  )
}
