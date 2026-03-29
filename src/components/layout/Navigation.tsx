import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

export function Navigation() {
  return (
    <nav className="flex items-center gap-2" aria-label="Hauptnavigation">
      <Link
        href="/"
        className="text-sm font-medium text-sand-500 hover:text-[#1a1714] dark:hover:text-[#faf9f7] transition-colors"
      >
        Journal
      </Link>
      <ThemeToggle />
    </nav>
  )
}
