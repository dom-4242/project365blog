'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { useTransition } from 'react'
import { Icon } from '@/components/ui/Icon'

const LOCALES = [
  { code: 'de', label: 'DE' },
  { code: 'en', label: 'EN' },
  { code: 'pt', label: 'PT' },
] as const

type LocaleCode = (typeof LOCALES)[number]['code']

export function LocaleSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function switchLocale(next: LocaleCode) {
    startTransition(() => {
      router.replace(pathname, { locale: next })
    })
  }

  return (
    <div
      className="flex items-center border border-outline-variant/20 rounded overflow-hidden"
      aria-label="Sprache / Language / Idioma"
    >
      <Icon name="language" size={14} className="text-on-surface-variant ml-1.5 shrink-0" />
      {LOCALES.map(({ code, label }, i) => (
        <button
          key={code}
          type="button"
          onClick={() => switchLocale(code)}
          disabled={isPending || locale === code}
          aria-current={locale === code ? 'true' : undefined}
          className={[
            'h-7 px-2 text-xs font-label font-bold tracking-widest transition-colors',
            i > 0 ? 'border-l border-outline-variant/20' : '',
            locale === code
              ? 'text-on-surface cursor-default bg-surface-container'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer disabled:opacity-40',
          ].join(' ')}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
