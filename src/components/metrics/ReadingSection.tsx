'use client'

import { useLocale } from 'next-intl'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export interface ReadingStats {
  pagesPerDay: { date: string; pages: number }[]
  currentBook: {
    title: string
    author: string | null
    totalPages: number | null
    pagesRead: number
  } | null
  booksThisYear: number
}

function formatDateShort(dateStr: string, locale: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  })
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function PagesTooltip({ active, payload, label }: TooltipProps) {
  const locale = useLocale()
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-container border border-outline-variant/15 rounded px-3 py-2 text-sm">
      <p className="text-on-surface-variant text-xs mb-0.5">{formatDateShort(label ?? '', locale)}</p>
      <p className="font-semibold text-on-surface">{payload[0].value} Seiten</p>
    </div>
  )
}

export function ReadingSection({ stats }: { stats: ReadingStats }) {
  const locale = useLocale()
  const { pagesPerDay, currentBook, booksThisYear } = stats

  const progress = currentBook?.totalPages && currentBook.pagesRead
    ? Math.min(100, Math.round((currentBook.pagesRead / currentBook.totalPages) * 100))
    : null

  const totalPages30d = pagesPerDay.reduce((s, d) => s + d.pages, 0)

  return (
    <div className="bg-surface-container rounded-xl border border-outline-variant/15 p-5 space-y-5">
      <div className="flex items-baseline justify-between">
        <h3 className="font-headline font-semibold text-sm text-on-surface">Lesen</h3>
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-xs text-on-surface-variant">30 Tage</p>
            <p className="text-lg font-bold font-headline text-on-surface">{totalPages30d} <span className="text-xs font-normal text-on-surface-variant">S.</span></p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant">Bücher {new Date().getFullYear()}</p>
            <p className="text-lg font-bold font-headline text-on-surface">{booksThisYear}</p>
          </div>
        </div>
      </div>

      {/* Aktuelles Buch */}
      {currentBook && (
        <div className="rounded-lg bg-surface-container-low border border-outline-variant/15 p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-on-surface truncate">{currentBook.title}</p>
              {currentBook.author && <p className="text-xs text-on-surface-variant">{currentBook.author}</p>}
            </div>
            <p className="text-xs text-on-surface-variant shrink-0">
              {currentBook.pagesRead}{currentBook.totalPages ? ` / ${currentBook.totalPages}` : ''} S.
              {progress !== null && ` · ${progress}%`}
            </p>
          </div>
          {progress !== null && (
            <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}

      {/* Seiten pro Tag Balkendiagramm */}
      {pagesPerDay.length > 0 && (
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={pagesPerDay} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--chart-axis)' }}
              tickFormatter={(v) => formatDateShort(v, locale)}
              tickLine={false}
              axisLine={{ stroke: 'var(--chart-axis-line)' }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 10, fill: 'var(--chart-axis)' }} tickLine={false} axisLine={false} />
            <Tooltip content={<PagesTooltip />} />
            <Bar dataKey="pages" fill="#ff8f70" radius={[2, 2, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
