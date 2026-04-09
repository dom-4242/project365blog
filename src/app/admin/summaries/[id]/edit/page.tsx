export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { SummaryEditForm } from '@/components/admin/SummaryEditForm'

const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

interface SummaryEditPageProps {
  params: { id: string }
}

export default async function SummaryEditPage({ params }: SummaryEditPageProps) {
  const summary = await prisma.monthSummary.findUnique({ where: { id: params.id } })
  if (!summary) notFound()

  const monthLabel = `${MONTH_NAMES[summary.month - 1]} ${summary.year}`

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ctp-text">
          {monthLabel} — Zusammenfassung bearbeiten
        </h1>
        <p className="text-xs text-sand-400 mt-1">
          Generiert am {summary.generatedAt.toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <SummaryEditForm summary={summary} />
    </div>
  )
}
