'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { useTransition } from 'react'

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

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as LocaleCode
    startTransition(() => {
      router.replace(pathname, { locale: next })
    })
  }

  return (
    <select
      value={locale}
      onChange={handleChange}
      disabled={isPending}
      aria-label="Sprache / Language / Idioma"
      className="h-8 px-1.5 rounded-lg text-xs font-semibold text-on-surface-variant bg-transparent hover:text-on-surface hover:bg-surface-container hover:bg-surface-container transition-colors disabled:opacity-50 cursor-pointer border-0 focus:outline-none focus:ring-2 focus:ring-outline focus:ring-surface-container-high"
    >
      {LOCALES.map(({ code, label }) => (
        <option key={code} value={code} className="bg-surface-container text-on-surface">
          {label}
        </option>
      ))}
    </select>
  )
}
