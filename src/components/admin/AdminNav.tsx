'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

const navItems = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/entries', label: 'Einträge', exact: false },
  { href: '/admin/metrics', label: 'Metriken', exact: false },
  { href: '/admin/fitbit', label: 'Fitbit', exact: false },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1" aria-label="Admin Navigation">
      {navItems.map(({ href, label, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-sand-100 dark:bg-[#3a3531] text-[#1a1714] dark:text-[#faf9f7]'
                : 'text-sand-500 hover:text-[#1a1714] dark:hover:text-[#faf9f7] hover:bg-sand-50 dark:hover:bg-[#2d2926]'
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
