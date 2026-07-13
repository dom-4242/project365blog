'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { clsx } from 'clsx'
import { Icon } from '@/components/ui/Icon'

const LOCALES = ['de', 'en', 'pt'] as const

export function CoachHeader({ userName }: { userName?: string | null }) {
  const t = useTranslations('Coach')
  const locale = useLocale()

  return (
    <header className="sticky top-0 z-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/15">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-2">
          <span className="font-headline text-sm font-bold text-on-surface tracking-tight">
            Project <span className="text-primary">365</span>
          </span>
          <span className="text-on-surface-variant text-sm font-label tracking-widest uppercase">
            {t('coachArea')}
          </span>
        </div>

        <div className="flex items-center gap-5">
          {/* Locale switcher */}
          <nav className="flex items-center gap-1" aria-label="Language">
            {LOCALES.map((l) => (
              <Link
                key={l}
                href={`/coach/${l}`}
                className={clsx(
                  'px-2 py-1 text-xs font-label font-bold tracking-widest uppercase rounded-md transition-colors',
                  l === locale
                    ? 'bg-surface-bright text-on-surface'
                    : 'text-on-surface-variant hover:text-on-surface',
                )}
              >
                {l}
              </Link>
            ))}
          </nav>

          {userName && (
            <span className="hidden sm:inline text-xs text-on-surface-variant">{userName}</span>
          )}

          <Link
            href="/api/auth/signout"
            className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <Icon name="logout" size={20} className="text-[16px]" />
            {t('signOut')}
          </Link>
        </div>
      </div>
    </header>
  )
}
