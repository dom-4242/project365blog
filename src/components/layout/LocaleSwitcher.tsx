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
      className="h-8 px-1.5 rounded-lg text-xs font-semibold text-sand-500 bg-transparent hover:text-[#1a1714] dark:hover:text-[#faf9f7] hover:bg-sand-100 dark:hover:bg-[#3a3531] transition-colors disabled:opacity-50 cursor-pointer border-0 focus:outline-none focus:ring-2 focus:ring-sand-300 dark:focus:ring-[#4a4540]"
    >
      {LOCALES.map(({ code, label }) => (
        <option key={code} value={code} className="bg-white dark:bg-[#2d2926] text-[#1a1714] dark:text-[#faf9f7]">
          {label}
        </option>
      ))}
    </select>
  )
}
