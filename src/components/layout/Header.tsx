import Link from 'next/link'
import { Navigation } from './Navigation'

export function Header() {
  return (
    <header className="border-b border-outline-variant/15 bg-surface-container-low/80 backdrop-blur-xl sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-2">
          <span className="font-headline text-lg font-bold tracking-tight text-on-surface group-hover:text-nutrition-700 group-hover:text-nutrition-500 transition-colors">
            Project <span className="text-nutrition-600">365</span>
          </span>
        </Link>
        <Navigation />
      </div>
    </header>
  )
}
