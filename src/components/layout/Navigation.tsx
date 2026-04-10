import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
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
        className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
      >
        {t('journal')}
      </Link>
      <SearchModal />
      <LocaleSwitcher />
      {isAdmin && (
        <Link
          href="/admin"
          className="text-sm font-medium text-primary hover:text-primary-container transition-colors"
          title={t('adminTitle')}
        >
          {t('admin')}
        </Link>
      )}
    </nav>
  )
}
