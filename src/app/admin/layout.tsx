import { getAuthSession, requireAdmin } from '@/lib/auth'
import Link from 'next/link'
import { AdminNav } from '@/components/admin/AdminNav'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await requireAdmin()

  // Login page renders without the admin chrome (no header/nav needed)
  if (!session) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-sand-100 dark:bg-[#141210]">
      <header className="bg-white dark:bg-[#1a1714] border-b border-sand-200 dark:border-[#4a4540] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-display text-base font-bold text-[#1a1714] dark:text-[#faf9f7]">
              Project <span className="text-nutrition-600">365</span>{' '}
              <span className="text-sand-400 font-normal text-sm">Admin</span>
            </Link>
            <AdminNav />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-sand-500 hover:text-[#1a1714] dark:hover:text-[#faf9f7] transition-colors"
              title="Zur öffentlichen Seite"
            >
              ↗ Zur Seite
            </Link>
            {session.user?.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name ?? 'Admin'}
                className="w-7 h-7 rounded-full"
              />
            )}
            <Link
              href="/api/auth/signout"
              className="text-sm text-sand-500 hover:text-[#1a1714] dark:hover:text-[#faf9f7] transition-colors"
            >
              Abmelden
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  )
}
