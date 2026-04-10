import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { LocaleSwitcher } from './LocaleSwitcher'
import { SearchModal } from '@/components/search/SearchModal'
import { getAuthSession } from '@/lib/auth'
import { Icon } from '@/components/ui/Icon'

export async function Navigation() {
  const session = await getAuthSession()
  const isAdmin = !!session?.user?.isAdmin
  const t = await getTranslations('Navigation')

  return (
    <nav className="flex items-center gap-1" aria-label={t('ariaLabel')}>
      <Link
        href="/"
        className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-label font-bold tracking-widest uppercase text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
      >
        <Icon name="article" size={16} />
        {t('journal')}
      </Link>

      <SearchModal />

      <LocaleSwitcher />

      {isAdmin && (
        <Link
          href="/admin"
          title={t('adminTitle')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-label font-bold tracking-widest uppercase text-primary hover:text-on-surface hover:bg-primary/10 transition-colors"
        >
          <Icon name="shield_person" size={16} />
          {t('admin')}
        </Link>
      )}
    </nav>
  )
}
