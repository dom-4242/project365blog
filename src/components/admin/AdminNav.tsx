'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

const NAV_GROUPS = [
  {
    label: null,
    items: [{ href: '/admin', label: 'Dashboard', exact: true }],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/entries',      label: 'Einträge',          exact: false },
      { href: '/admin/translations', label: 'Übersetzungen',     exact: false },
      { href: '/admin/summaries',    label: 'Zusammenfassungen', exact: false },
    ],
  },
  {
    label: 'Daten',
    items: [
      { href: '/admin/quick-log', label: 'Quick Log', exact: false },
      { href: '/admin/metrics',            label: 'Metriken',    exact: false },
      { href: '/admin/body-measurements', label: 'Körpermasse', exact: false },
      { href: '/admin/fitbit',    label: 'Fitbit',    exact: false },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/analytics',  label: 'Analytics',    exact: false },
      { href: '/admin/settings',   label: 'Einstellungen', exact: false },
    ],
  },
]

// Flat list for mobile horizontal nav
const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items)

function NavLink({ href, label, exact }: { href: string; label: string; exact: boolean }) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={clsx(
        'block px-3 py-1.5 rounded-lg text-sm transition-colors',
        isActive
          ? 'bg-surface-container text-on-surface font-medium'
          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
      )}
    >
      {label}
    </Link>
  )
}

/** Sidebar — shown on md+ */
export function AdminSidebar() {
  return (
    <nav className="space-y-5 py-4 px-3">
      {NAV_GROUPS.map((group, i) => (
        <div key={i}>
          {group.label && (
            <p className="px-3 mb-1 text-[10px] font-semibold tracking-widest uppercase text-on-surface-variant">
              {group.label}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

/** Compact horizontal nav — shown on mobile */
export function AdminNavMobile() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1 overflow-x-auto px-4 py-2 scrollbar-none">
      {ALL_ITEMS.map(({ href, label, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex-none px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors',
              isActive
                ? 'bg-surface-container text-on-surface font-medium'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

/** @deprecated use AdminSidebar / AdminNavMobile */
export function AdminNav() {
  return <AdminNavMobile />
}
