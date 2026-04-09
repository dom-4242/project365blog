import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ThemeToggle } from './ThemeToggle'
import { LocaleSwitcher } from './LocaleSwitcher'
import { SearchModal } from '@/components/search/SearchModal'
import { getAuthSession } from '@/lib/auth'

export async function Navigation() {
  const session = await getAuthSession()
  const isAdmin = !!session?.user?.isAdmin
  const t = await getTranslations('Navigation')

  return (
    <nav className="flex items-center gap-2" aria-label={t('ariaLabel')}>
      <Link
        href="/"
        className="text-sm font-medium text-sand-500 hover:text-ctp-text transition-colors"
      >
        {t('journal')}
      </Link>
      <SearchModal />
      <LocaleSwitcher />
      {isAdmin && (
        <Link
          href="/admin"
          className="text-sm font-medium text-nutrition-600 dark:text-nutrition-500 hover:text-nutrition-700 dark:hover:text-nutrition-400 transition-colors"
          title={t('adminTitle')}
        >
          {t('admin')}
        </Link>
      )}
      <ThemeToggle />
    </nav>
  )
}
