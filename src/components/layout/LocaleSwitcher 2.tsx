'use client'

import { useTranslations, useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { useTransition } from 'react'

export function LocaleSwitcher() {
  const t = useTranslations('LocaleSwitcher')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const targetLocale = locale === 'de' ? 'en' : 'de'

  function handleSwitch() {
    startTransition(() => {
      router.replace(pathname, { locale: targetLocale })
    })
  }

  return (
    <button
      onClick={handleSwitch}
      disabled={isPending}
      aria-label={t('ariaLabel')}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold text-sand-500 hover:text-[#1a1714] dark:hover:text-[#faf9f7] hover:bg-sand-100 dark:hover:bg-[#3a3531] transition-colors disabled:opacity-50"
    >
      {t('label')}
    </button>
  )
}
