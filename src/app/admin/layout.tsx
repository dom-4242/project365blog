import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { AdminSidebar, AdminNavMobile } from '@/components/admin/AdminNav'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await requireAdmin()

  // Login page renders without the admin chrome
  if (!session) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-surface-container-low">

      {/* ── Top bar ───────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-surface-container border-b border-surface-container">
        <div className="flex items-center justify-between px-4 sm:px-6 h-12">
          {/* Logo */}
          <Link href="/admin" className="font-display text-sm font-bold text-on-surface">
            Project <span className="text-primary">365</span>{' '}
            <span className="text-on-surface-variant font-normal">Admin</span>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <Link
              href="/de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
              title="Zur öffentlichen Seite"
            >
              ↗ Zur Seite
            </Link>
            {session.user?.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name ?? 'Admin'}
                className="w-6 h-6 rounded-full"
              />
            )}
            <Link
              href="/api/auth/signout"
              className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Abmelden
            </Link>
          </div>
        </div>

        {/* Mobile nav — horizontal scroll below top bar */}
        <div className="md:hidden border-t border-surface-container">
          <AdminNavMobile />
        </div>
      </header>

      {/* ── Body: Sidebar + Content ───────────────── */}
      <div className="flex">

        {/* Sidebar — desktop only */}
        <aside className="hidden md:block w-44 shrink-0 sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto border-r border-surface-container bg-surface-container">
          <AdminSidebar />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
