import Link from 'next/link'
import { getAuthSession } from '@/lib/auth'

export default async function AdminPage() {
  const session = await getAuthSession()

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-[#1a1714] mb-1">
          Willkommen, {session?.user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sand-500 text-sm">Was möchtest du heute tun?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/entries/new"
          className="group bg-white rounded-2xl border border-sand-200 p-6 hover:border-nutrition-300 hover:shadow-sm transition-all"
        >
          <div className="w-10 h-10 bg-nutrition-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-nutrition-200 transition-colors">
            <svg
              className="w-5 h-5 text-nutrition-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h2 className="font-display text-lg font-semibold text-[#1a1714] mb-1">
            Neuer Eintrag
          </h2>
          <p className="text-sand-500 text-sm">Journal-Eintrag mit Habits erfassen</p>
        </Link>

        <Link
          href="/admin/metrics"
          className="group bg-white rounded-2xl border border-sand-200 p-6 hover:border-movement-300 hover:shadow-sm transition-all"
        >
          <div className="w-10 h-10 bg-movement-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-movement-200 transition-colors">
            <svg
              className="w-5 h-5 text-movement-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h2 className="font-display text-lg font-semibold text-[#1a1714] mb-1">
            Metriken erfassen
          </h2>
          <p className="text-sand-500 text-sm">Gewicht, Schritte und weitere Werte</p>
        </Link>
      </div>
    </div>
  )
}
