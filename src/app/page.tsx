export const dynamic = 'force-dynamic'

import { getAllEntries } from '@/lib/journal'
import { JournalFeed } from '@/components/journal/JournalFeed'
import { HabitsDashboard } from '@/components/habits/HabitsDashboard'
import { MetricsDashboard } from '@/components/metrics/MetricsDashboard'

export default function HomePage() {
  const entries = getAllEntries()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <header className="mb-14">
        <p className="text-xs font-medium tracking-widest uppercase text-sand-500 mb-3">
          Ein öffentliches Projekt
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight text-[#1a1714] mb-4">
          365 Tage.<br />Öffentlich. Ehrlich.
        </h1>
        <p className="text-lg text-[#6b6560] max-w-xl leading-relaxed">
          Tägliche Einträge über Bewegung, Ernährung und den Weg zum Rauchstopp —
          mit echten Zahlen, guten und schlechten Tagen.
        </p>
      </header>

      <HabitsDashboard />

      <MetricsDashboard />

      {/* Journal-Feed mit Section-Header */}
      <section>
        <div className="flex items-center gap-4 mb-6">
          <h2 className="font-display text-xl font-bold text-[#1a1714] shrink-0">Einträge</h2>
          <div className="flex-1 border-t border-sand-200" aria-hidden="true" />
        </div>
        <JournalFeed entries={entries} />
      </section>
    </div>
  )
}
