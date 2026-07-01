import { prisma } from '@/lib/db'
import { NutritionImportPanel } from '@/components/admin/NutritionImportPanel'

export const dynamic = 'force-dynamic'

function fmt(date: Date | null): string {
  if (!date) return '—'
  return date.toLocaleDateString('de-CH', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default async function NutritionImportPage() {
  const [count, range, distinctDays] = await Promise.all([
    prisma.nutritionLog.count(),
    prisma.nutritionLog.aggregate({ _min: { date: true }, _max: { date: true } }),
    prisma.nutritionLog.findMany({ distinct: ['date'], select: { date: true } }),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">Ernährung importieren (MyFitnessPal)</h1>
        <p className="text-on-surface-variant text-sm">
          MyFitnessPal-Daten via offiziellem CSV-Export importieren. Der Import ist idempotent — dieselbe
          Datei mehrfach hochladen überschreibt, dupliziert nicht.
        </p>
      </div>

      <section>
        <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Import</h2>
        <NutritionImportPanel />
      </section>

      <section>
        <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Aktueller Bestand</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Einträge', value: count.toLocaleString('de-CH') },
            { label: 'Tage', value: distinctDays.length.toLocaleString('de-CH') },
            { label: 'Zeitraum', value: count > 0 ? `${fmt(range._min.date)} – ${fmt(range._max.date)}` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="p-4 bg-surface-container rounded-xl border border-outline-variant/15 text-center">
              <p className="text-lg font-headline font-bold text-on-surface">{value}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/10 text-xs text-on-surface-variant space-y-1.5">
        <p className="font-semibold text-on-surface">So exportierst du die MFP-Daten</p>
        <ol className="space-y-1 list-decimal list-inside">
          <li>MyFitnessPal Web → <span className="text-on-surface">Einstellungen → Daten exportieren</span> (Nutrition, Zeitraum wählen).</li>
          <li>Der Export kommt per E-Mail als ZIP mit mehreren CSVs.</li>
          <li>Hier die <code className="font-mono">Nutrition</code>-CSV hochladen (mit <code className="font-mono">Date</code>- und <code className="font-mono">Meal</code>-Spalte).</li>
        </ol>
        <p className="mt-2 pt-2 border-t border-outline-variant/10">
          Nur Ernährungsdaten werden übernommen. Gewicht kommt aus Withings, Schritte/Aktivität aus Apple
          Health (siehe <code className="font-mono">lib/metric-sources.ts</code>). Importierte Nährstoffe
          erscheinen im <span className="text-on-surface">Health Inventar</span> unter dem Tab „MyFitnessPal".
        </p>
      </div>
    </div>
  )
}
