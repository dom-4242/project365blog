import Link from 'next/link'
import { Navigation } from './Navigation'

export function Header() {
  return (
    <header className="border-b border-outline-variant/15 bg-surface-container-low/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-0.5">
          <span className="font-headline font-bold tracking-tighter text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
            PROJECT{' '}
          </span>
          <span className="font-headline font-bold tracking-tighter text-sm text-primary">
            365
          </span>
        </Link>

        <Navigation />
      </div>
    </header>
  )
}
