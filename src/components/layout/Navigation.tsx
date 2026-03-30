import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { SearchModal } from '@/components/search/SearchModal'
import { getAuthSession } from '@/lib/auth'

export async function Navigation() {
  const session = await getAuthSession()
  const isAdmin = !!session?.user?.isAdmin

  return (
    <nav className="flex items-center gap-2" aria-label="Hauptnavigation">
      <Link
        href="/"
        className="text-sm font-medium text-sand-500 hover:text-[#1a1714] dark:hover:text-[#faf9f7] transition-colors"
      >
        Journal
      </Link>
      <SearchModal />
      {isAdmin && (
        <Link
          href="/admin"
          className="text-sm font-medium text-nutrition-600 dark:text-nutrition-500 hover:text-nutrition-700 dark:hover:text-nutrition-400 transition-colors"
          title="Admin-Bereich"
        >
          Admin
        </Link>
      )}
      <ThemeToggle />
    </nav>
  )
}
