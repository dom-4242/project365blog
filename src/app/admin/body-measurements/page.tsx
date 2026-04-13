import { prisma } from '@/lib/db'
import { BodyMeasurementForm } from '@/components/admin/BodyMeasurementForm'
import { DatePicker } from '@/components/admin/DatePicker'

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function fmt(v: number | null): string {
  return v != null ? `${v}` : '—'
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-CH', { year: 'numeric', month: 'short', day: 'numeric' })
}

interface PageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function BodyMeasurementsPage({ searchParams }: PageProps) {
  const { date: dateParam } = await searchParams
  const date = dateParam ?? todayString()

  const existing = await prisma.bodyMeasurement.findUnique({
    where: { date: new Date(date) },
  })

  const history = await prisma.bodyMeasurement.findMany({
    orderBy: { date: 'desc' },
    take: 10,
  })

  const initial = existing
    ? {
        chest:         existing.chest?.toString()         ?? '',
        waist:         existing.waist?.toString()         ?? '',
        hip:           existing.hip?.toString()           ?? '',
        upperArmLeft:  existing.upperArmLeft?.toString()  ?? '',
        upperArmRight: existing.upperArmRight?.toString() ?? '',
        thighLeft:     existing.thighLeft?.toString()     ?? '',
        thighRight:    existing.thighRight?.toString()    ?? '',
        calfLeft:      existing.calfLeft?.toString()      ?? '',
        calfRight:     existing.calfRight?.toString()     ?? '',
        neck:          existing.neck?.toString()          ?? '',
        notes:         existing.notes                     ?? '',
      }
    : undefined

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">Körpermasse</h1>
        <p className="text-on-surface-variant text-sm">Umfangmessungen mit Massband erfassen</p>
      </div>

      {/* Datum-Picker */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-on-surface-variant">Datum</label>
        <DatePicker defaultValue={date} />
      </div>

      <BodyMeasurementForm date={date} initial={initial} />

      {/* Verlaufstabelle */}
      {history.length > 0 && (
        <div>
          <h2 className="font-headline text-base font-semibold text-on-surface mb-3">Verlauf</h2>
          <div className="bg-surface-container rounded-2xl border border-surface-container-high overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-container text-on-surface-variant text-left">
                    <th className="px-4 py-3 font-medium">Datum</th>
                    <th className="px-4 py-3 font-medium">Brust</th>
                    <th className="px-4 py-3 font-medium">Taille</th>
                    <th className="px-4 py-3 font-medium">Hüfte</th>
                    <th className="px-4 py-3 font-medium">O.Arm L/R</th>
                    <th className="px-4 py-3 font-medium">O.Schenkel L/R</th>
                    <th className="px-4 py-3 font-medium">Wade L/R</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.id} className="border-b border-surface-container last:border-0 hover:bg-surface-container-high transition-colors">
                      <td className="px-4 py-3 font-mono text-on-surface-variant whitespace-nowrap">{formatDate(row.date)}</td>
                      <td className="px-4 py-3 text-on-surface">{fmt(row.chest)}</td>
                      <td className="px-4 py-3 text-on-surface">{fmt(row.waist)}</td>
                      <td className="px-4 py-3 text-on-surface">{fmt(row.hip)}</td>
                      <td className="px-4 py-3 text-on-surface">{fmt(row.upperArmLeft)} / {fmt(row.upperArmRight)}</td>
                      <td className="px-4 py-3 text-on-surface">{fmt(row.thighLeft)} / {fmt(row.thighRight)}</td>
                      <td className="px-4 py-3 text-on-surface">{fmt(row.calfLeft)} / {fmt(row.calfRight)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
