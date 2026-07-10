import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  getActivePhase,
  listPhases,
  listTargetVersions,
  resolveTargetsForDate,
} from '@/lib/nutrition/targets'
import { getActiveRefeedRule, deriveRefeedSoll } from '@/lib/nutrition/refeed'
import { zurichDateStr } from '@/lib/timezone'
import {
  NutritionPhaseForm,
  type NutritionPhaseFormInitial,
} from '@/components/admin/NutritionPhaseForm'
import { RefeedRuleForm } from '@/components/admin/RefeedRuleForm'
import type { NutritionTargets } from '@prisma/client'

export const dynamic = 'force-dynamic'

const PHASE_MODE_LABEL: Record<string, string> = {
  DEFICIT: 'Defizit',
  MAINTENANCE: 'Erhalt',
  SURPLUS: 'Leichter Überschuss',
}
const DEFICIT_LABEL: Record<string, string> = {
  MODERATE: 'moderat (× 0,8)',
  AGGRESSIVE: 'aggressiv (× 0,7)',
  SIMPLE: 'einfach (− 500)',
}

function fmtDate(d: Date | null): string {
  if (!d) return '—'
  return d.toLocaleDateString('de-CH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function initialFromTargets(t: NutritionTargets | null): NutritionPhaseFormInitial {
  const today = zurichDateStr()
  if (!t) {
    // Fallback-Defaults (Fibel-Ausgangswerte)
    return {
      weightKg: '94',
      heightCm: '170',
      age: '43',
      sex: 'MALE',
      bodyFatPct: '27',
      activityFactor: '1.55',
      phaseMode: 'DEFICIT',
      deficitMethod: 'MODERATE',
      validFrom: today,
    }
  }
  return {
    weightKg: t.baseWeightKg.toString(),
    heightCm: t.heightCm.toString(),
    age: t.age.toString(),
    sex: t.sex,
    bodyFatPct: t.bodyFatPct?.toString() ?? '',
    activityFactor: t.activityFactor.toString(),
    phaseMode: 'DEFICIT',
    deficitMethod: t.deficitMode,
    validFrom: today,
  }
}

export default async function NutritionPage() {
  const session = await requireAdmin()
  if (!session) redirect('/admin/login')

  const [active, todayTargets, phases, versions] = await Promise.all([
    getActivePhase(),
    resolveTargetsForDate(),
    listPhases(),
    listTargetVersions(),
  ])

  const initial = initialFromTargets(active?.targets ?? todayTargets)

  const refeedRule = active ? await getActiveRefeedRule(active.id) : null
  const refeedBaseTargets = active?.targets ?? todayTargets
  const derivedRefeedSoll = refeedBaseTargets ? deriveRefeedSoll(refeedBaseTargets) : null

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-headline text-2xl font-bold text-on-surface">Ernährung — Ziele & Phasen</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Eckdaten nach Fibel-Methodik: BMR → TDEE → Defizit → Makros. Versioniert über das
          Gültig-ab-Datum.
        </p>
      </div>

      {/* Aktuell gültige Eckdaten (heute) */}
      <section className="mb-8">
        <h2 className="font-headline text-base font-semibold text-on-surface mb-3">
          Aktuell gültig ({fmtDate(new Date())})
        </h2>
        {todayTargets ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Ziel-Kalorien" value={`${todayTargets.targetKcal}`} unit="kcal" accent />
            <Stat label="Protein" value={`${todayTargets.proteinG}`} unit="g" />
            <Stat label="Fett" value={`${todayTargets.fatG}`} unit="g" />
            <Stat label="Kohlenhydrate" value={`${todayTargets.carbsG}`} unit="g" />
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">
            Noch keine gültigen Eckdaten für heute. Lege unten eine Phase an.
          </p>
        )}
        {active && (
          <p className="text-xs text-on-surface-variant mt-2">
            Aktive Phase: <span className="text-on-surface">{PHASE_MODE_LABEL[active.mode] ?? active.mode}</span>{' '}
            seit {fmtDate(active.startDate)}
            {active.note ? ` · ${active.note}` : ''}
          </p>
        )}
      </section>

      {/* Formular */}
      <section className="mb-10">
        <h2 className="font-headline text-base font-semibold text-on-surface mb-3">
          Phase anlegen / Eckdaten berechnen
        </h2>
        <NutritionPhaseForm initial={initial} />
      </section>

      {/* Refeed-Regel */}
      <section className="mb-10">
        <h2 className="font-headline text-base font-semibold text-on-surface mb-3">Refeed-Tage</h2>
        {active ? (
          <RefeedRuleForm
            initialWeekdays={refeedRule?.recurringWeekdays ?? []}
            derivedSoll={derivedRefeedSoll}
          />
        ) : (
          <p className="text-sm text-on-surface-variant">Erst eine aktive Phase anlegen.</p>
        )}
      </section>

      {/* Phasen-Verlauf */}
      <section className="mb-10">
        <h2 className="font-headline text-base font-semibold text-on-surface mb-3">Phasen</h2>
        {phases.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Noch keine Phasen.</p>
        ) : (
          <TableWrap
            head={['Modus', 'Start', 'Ende', 'Status', 'Ziel-kcal', 'Notiz']}
            rows={phases.map((p) => [
              PHASE_MODE_LABEL[p.mode] ?? p.mode,
              fmtDate(p.startDate),
              fmtDate(p.endDate),
              p.status,
              p.targets ? `${p.targets.targetKcal} kcal` : '—',
              p.note ?? '—',
            ])}
          />
        )}
      </section>

      {/* Eckdaten-Versionen */}
      <section>
        <h2 className="font-headline text-base font-semibold text-on-surface mb-3">
          Eckdaten-Versionen
        </h2>
        {versions.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Noch keine Eckdaten.</p>
        ) : (
          <TableWrap
            head={['Gültig ab', 'kcal', 'P', 'F', 'KH', 'Gewicht', 'Methode']}
            rows={versions.map((v) => [
              fmtDate(v.validFrom),
              `${v.targetKcal}`,
              `${v.proteinG}`,
              `${v.fatG}`,
              `${v.carbsG}`,
              `${v.baseWeightKg} kg`,
              DEFICIT_LABEL[v.deficitMode] ?? v.deficitMode,
            ])}
          />
        )}
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  unit,
  accent,
}: {
  label: string
  value: string
  unit: string
  accent?: boolean
}) {
  return (
    <div className="bg-surface-container rounded-2xl border border-surface-container-high p-4">
      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">{label}</p>
      <p className={`font-headline text-xl font-bold tabular-nums ${accent ? 'text-primary' : 'text-on-surface'}`}>
        {value} <span className="text-xs font-normal text-on-surface-variant">{unit}</span>
      </p>
    </div>
  )
}

function TableWrap({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="bg-surface-container rounded-2xl border border-surface-container-high overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-surface-container text-on-surface-variant text-left">
              {head.map((h) => (
                <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-surface-container last:border-0">
                {r.map((c, j) => (
                  <td key={j} className="px-4 py-3 text-on-surface whitespace-nowrap">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
