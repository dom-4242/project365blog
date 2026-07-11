'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { FoodItem } from '@prisma/client'
import { MEAL_SLOTS, type MealSlot } from '@/lib/nutrition/constants'
import type { MealEntryResolved } from '@/lib/nutrition/meals'
import type { FavoriteResolved } from '@/lib/nutrition/favorites'
import type { DishWithItems } from '@/lib/nutrition/dishes'
import type { DaySummary } from '@/lib/nutrition/day-aggregate'
import { aggregateMicros, microCoverage, MICRO_META } from '@/lib/nutrition/micros'
import { kcalTone, proteinTone, budgetTone, type Tone } from '@/lib/nutrition/traffic-light'

// Tailwind-Klassen je Ampel-Tone — hier (im gescannten Component-Ordner) statt
// in lib/, damit der Tailwind-Content-Scan sie nicht wegpurged.
const TONE_TEXT: Record<Tone, string> = {
  good: 'text-movement-400',
  warn: 'text-amber-400',
  bad: 'text-error',
}
const TONE_DOT: Record<Tone, string> = {
  good: 'bg-movement-400',
  warn: 'bg-amber-400',
  bad: 'bg-error',
}
import { BarcodeScanner } from '@/components/nutrition/BarcodeScanner'
import { PhotoEstimator } from '@/components/nutrition/PhotoEstimator'
import {
  logFoodEntry,
  logDishEntry,
  quickLogFavorite,
  logScannedBarcode,
  removeEntry,
  toggleRefeedDay,
} from '@/app/admin/log/actions'

interface Props {
  date: string
  entries: MealEntryResolved[]
  favorites: FavoriteResolved[]
  dishes: DishWithItems[]
  summary: DaySummary
}

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  FULFILLED: { text: 'Erfüllt', cls: 'bg-primary/15 text-primary border-primary/30' },
  NOT_FULFILLED: { text: 'Nicht erfüllt', cls: 'bg-error/15 text-error border-error/30' },
  OPEN: { text: 'Offen', cls: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30' },
}

const inputCls =
  'w-full border border-surface-container-high rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-on-surface-variant bg-surface-container'

function defaultSlot(): MealSlot {
  const h = new Date().getHours()
  if (h < 11) return 'Frühstück'
  if (h < 15) return 'Mittag'
  if (h < 21) return 'Abend'
  return 'Snack'
}

type Tab = 'katalog' | 'gericht' | 'scan' | 'foto'

export function MealLogger({ date, entries, favorites, dishes, summary }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [slot, setSlot] = useState<MealSlot>(defaultSlot())
  const [tab, setTab] = useState<Tab>('katalog')

  function go(fn: () => Promise<{ error?: string; success?: boolean }>, ok: string) {
    setMsg(null)
    startTransition(async () => {
      const r = await fn()
      if (r.error) setMsg({ kind: 'err', text: r.error })
      else {
        setMsg({ kind: 'ok', text: ok })
        router.refresh()
      }
    })
  }

  // --- Datum-Navigation -----------------------------------------------------
  function shiftDay(delta: number) {
    const d = new Date(`${date}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + delta)
    router.push(`/admin/log?date=${d.toISOString().slice(0, 10)}`)
  }

  // --- Katalog-Suche --------------------------------------------------------
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [localResults, setLocalResults] = useState<FoodItem[] | null>(null)
  const [selected, setSelected] = useState<FoodItem | null>(null)
  const [amount, setAmount] = useState('100')

  async function search() {
    if (query.trim().length < 2) return
    setSearching(true)
    try {
      const res = await fetch(`/api/nutrition/food/search?q=${encodeURIComponent(query.trim())}`)
      const data = (await res.json()) as { local: FoodItem[] }
      setLocalResults(data.local ?? [])
    } catch {
      setMsg({ kind: 'err', text: 'Suche fehlgeschlagen.' })
    } finally {
      setSearching(false)
    }
  }

  // --- Gericht --------------------------------------------------------------
  const [dishId, setDishId] = useState('')
  const [multiplier, setMultiplier] = useState('1')

  // --- Scan -----------------------------------------------------------------
  const [scanCode, setScanCode] = useState<string | null>(null)
  const [scanAmount, setScanAmount] = useState('100')

  // --- Tagesliste gruppiert -------------------------------------------------
  const grouped = useMemo(() => {
    const map = new Map<string, MealEntryResolved[]>()
    for (const s of MEAL_SLOTS) map.set(s, [])
    const other: MealEntryResolved[] = []
    for (const e of entries) {
      const key = e.mealSlot && map.has(e.mealSlot) ? e.mealSlot : null
      if (key) map.get(key)!.push(e)
      else other.push(e)
    }
    return { map, other }
  }, [entries])

  const { soll, ist } = summary
  const remaining = soll ? Math.round((soll.kcal - ist.kcal) * 10) / 10 : null
  const status = STATUS_LABEL[summary.fulfillmentStatus] ?? STATUS_LABEL.OPEN

  // --- Mikros (N-12): null-bewusste Tagessumme aus den Snapshots ------------
  const micros = useMemo(() => aggregateMicros(entries), [entries])
  const microCov = microCoverage(micros)

  return (
    <div className="space-y-6">
      {/* Datum + Slot */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => shiftDay(-1)} className="px-2 py-1 rounded-lg border border-surface-container-high text-on-surface-variant hover:text-on-surface">‹</button>
          <input
            type="date"
            value={date}
            onChange={(e) => router.push(`/admin/log?date=${e.target.value}`)}
            className="border border-surface-container-high rounded-lg px-3 py-1.5 text-sm text-on-surface bg-surface-container focus:outline-none"
          />
          <button type="button" onClick={() => shiftDay(1)} className="px-2 py-1 rounded-lg border border-surface-container-high text-on-surface-variant hover:text-on-surface">›</button>
        </div>
        <div className="flex gap-1">
          {MEAL_SLOTS.map((sName) => (
            <button
              key={sName}
              type="button"
              onClick={() => setSlot(sName)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                slot === sName
                  ? 'bg-primary text-on-primary'
                  : 'border border-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {sName}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <div className={`p-3 rounded-lg text-sm ${msg.kind === 'ok' ? 'bg-primary/10 border border-primary/30 text-primary' : 'bg-error/10 border border-error/30 text-error'}`}>
          {msg.text}
        </div>
      )}

      {/* Favoriten — 1-Klick in aktiven Slot */}
      <section>
        <h3 className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">
          Favoriten → {slot}
        </h3>
        {favorites.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            Noch keine Favoriten. Lebensmittel/Gerichte mit ★ markieren.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {favorites.map((f) => {
              const label = f.foodItem?.name ?? f.dish?.name ?? '—'
              return (
                <button
                  key={f.id}
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    go(() => quickLogFavorite({ favoriteId: f.id, date, mealSlot: slot }), `„${label}" geloggt.`)
                  }
                  className="px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high text-sm text-on-surface hover:border-primary disabled:opacity-50 transition-colors"
                >
                  <span className="text-primary mr-1">＋</span>
                  {label}
                  <span className="text-on-surface-variant text-xs ml-1">
                    {f.foodItem ? 'Lebensmittel' : 'Gericht'}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Hinzufügen */}
      <section className="bg-surface-container rounded-2xl border border-surface-container-high p-5">
        <div className="flex gap-1 mb-4">
          {(['katalog', 'gericht', 'scan', 'foto'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                tab === t ? 'bg-surface-container-high text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t === 'katalog' ? 'Katalog' : t === 'gericht' ? 'Gericht' : t === 'scan' ? 'Scan' : 'Foto'}
            </button>
          ))}
        </div>

        {tab === 'katalog' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && search()}
                placeholder="Katalog durchsuchen…"
                className={inputCls}
              />
              <button type="button" onClick={search} disabled={searching || query.trim().length < 2}
                className="flex-none px-4 py-1.5 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary-container disabled:opacity-50 transition-colors">
                {searching ? '…' : 'Suchen'}
              </button>
            </div>

            {selected ? (
              <div className="rounded-xl bg-surface-container-high p-3 flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-on-surface truncate">{selected.name}</p>
                  <p className="text-xs text-on-surface-variant">{selected.kcal} kcal / 100 {selected.baseUnit}</p>
                </div>
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">Menge ({selected.baseUnit})</label>
                  <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)}
                    className="w-24 border border-surface-container-high rounded-lg px-2 py-1.5 text-sm text-on-surface bg-surface-container focus:outline-none" />
                </div>
                <button type="button" disabled={isPending}
                  onClick={() => go(
                    () => logFoodEntry({ date, foodItemId: selected.id, amount: parseFloat(amount.replace(',', '.')), mealSlot: slot }),
                    `„${selected.name}" geloggt.`,
                  )}
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary-container disabled:opacity-50 transition-colors">
                  Loggen
                </button>
                <button type="button" onClick={() => setSelected(null)} className="text-xs text-on-surface-variant hover:text-on-surface">Andere</button>
              </div>
            ) : (
              localResults && (
                localResults.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">Nichts im Katalog — über Lebensmittel anlegen oder scannen.</p>
                ) : (
                  <ul className="space-y-1">
                    {localResults.map((r) => (
                      <li key={r.id}>
                        <button type="button" onClick={() => { setSelected(r); setAmount('100') }}
                          className="w-full text-left rounded-lg px-3 py-2 hover:bg-surface-container-high transition-colors">
                          <span className="text-sm text-on-surface">{r.name}</span>
                          {r.brand && <span className="text-xs text-on-surface-variant"> · {r.brand}</span>}
                          <span className="text-xs text-on-surface-variant"> — {r.kcal} kcal</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )
              )
            )}
          </div>
        )}

        {tab === 'gericht' && (
          <div className="space-y-3">
            {dishes.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Noch keine Gerichte — unter Gerichte anlegen.</p>
            ) : (
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[12rem]">
                  <label className="block text-xs text-on-surface-variant mb-1">Gericht</label>
                  <select value={dishId} onChange={(e) => setDishId(e.target.value)} className={inputCls}>
                    <option value="">– wählen –</option>
                    {dishes.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">Portionen</label>
                  <input type="number" inputMode="decimal" step="0.25" value={multiplier} onChange={(e) => setMultiplier(e.target.value)}
                    className="w-24 border border-surface-container-high rounded-lg px-2 py-1.5 text-sm text-on-surface bg-surface-container focus:outline-none" />
                </div>
                <button type="button" disabled={isPending || !dishId}
                  onClick={() => go(
                    () => logDishEntry({ date, dishId, multiplier: parseFloat(multiplier.replace(',', '.')) || 1, mealSlot: slot }),
                    'Gericht geloggt.',
                  )}
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary-container disabled:opacity-50 transition-colors">
                  Loggen
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'scan' && (
          <div className="space-y-3">
            {!scanCode ? (
              <BarcodeScanner onDetected={(code) => setScanCode(code)} />
            ) : (
              <div className="rounded-xl bg-surface-container-high p-3 flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-on-surface">Barcode {scanCode}</p>
                  <p className="text-xs text-on-surface-variant">Wird aus Katalog/OFF geladen und geloggt.</p>
                </div>
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">Menge (g)</label>
                  <input type="number" inputMode="decimal" value={scanAmount} onChange={(e) => setScanAmount(e.target.value)}
                    className="w-24 border border-surface-container-high rounded-lg px-2 py-1.5 text-sm text-on-surface bg-surface-container focus:outline-none" />
                </div>
                <button type="button" disabled={isPending}
                  onClick={() => go(
                    () => logScannedBarcode({ barcode: scanCode, date, amount: parseFloat(scanAmount.replace(',', '.')), mealSlot: slot }),
                    'Gescanntes Produkt geloggt.',
                  )}
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary-container disabled:opacity-50 transition-colors">
                  Loggen
                </button>
                <button type="button" onClick={() => setScanCode(null)} className="text-xs text-on-surface-variant hover:text-on-surface">Erneut scannen</button>
              </div>
            )}
          </div>
        )}

        {tab === 'foto' && (
          <PhotoEstimator
            date={date}
            mealSlot={slot}
            onLogged={(name) => {
              setMsg({ kind: 'ok', text: `„${name}" geloggt.` })
              router.refresh()
            }}
          />
        )}
      </section>

      {/* Tagesbilanz: SOLL / IST + Erfüllung */}
      <section className="bg-surface-container rounded-2xl border border-surface-container-high p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="font-headline text-sm font-semibold text-on-surface">
            Tagesbilanz
            {summary.isRefeed && (
              <span className="ml-2 text-[10px] uppercase tracking-widest text-tertiary">Refeed</span>
            )}
          </h3>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${status.cls}`}>
              {status.text}
            </span>
            <button
              type="button"
              disabled={isPending}
              onClick={() => go(() => toggleRefeedDay(date, !summary.isRefeed), summary.isRefeed ? 'Als Normaltag gesetzt.' : 'Als Refeed-Tag gesetzt.')}
              className="text-xs text-on-surface-variant hover:text-on-surface disabled:opacity-50"
            >
              {summary.isRefeed ? '→ Normaltag' : '→ Refeed-Tag'}
            </button>
          </div>
        </div>

        {soll ? (
          <div className="grid grid-cols-4 gap-2 text-center">
            {(() => {
              const isDeficitDay = summary.phaseMode === 'DEFICIT' && !summary.isRefeed
              const hasEntries = ist.count > 0
              return (
                <>
                  <Macro label="kcal" ist={ist.kcal} soll={soll.kcal} tone={hasEntries ? kcalTone(ist.kcal, soll.kcal, isDeficitDay) : undefined} />
                  <Macro label="Protein" ist={ist.proteinG} soll={soll.proteinG} unit="g" tone={hasEntries ? proteinTone(ist.proteinG, soll.proteinG) : undefined} />
                  <Macro label="KH" ist={ist.carbsG} soll={soll.carbsG} unit="g" tone={hasEntries ? budgetTone(ist.carbsG, soll.carbsG, isDeficitDay) : undefined} />
                  <Macro label="Fett" ist={ist.fatG} soll={soll.fatG} unit="g" tone={hasEntries ? budgetTone(ist.fatG, soll.fatG, isDeficitDay) : undefined} />
                </>
              )
            })()}
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">
            Kein SOLL — für diesen Tag sind keine Eckdaten hinterlegt (Phase anlegen).
          </p>
        )}
        {remaining != null && (
          <p className="text-xs text-on-surface-variant mt-2">
            {remaining >= 0 ? `Noch ${remaining} kcal bis SOLL.` : `${Math.abs(remaining)} kcal über SOLL.`}
          </p>
        )}
      </section>

      {/* Mikronährstoffe (N-12): best-effort, Lücken kenntlich */}
      {entries.length > 0 && <MicroPanel micros={micros} coverage={microCov} />}

      {/* Einträge gruppiert */}
      <section className="space-y-4">
        {entries.length === 0 && <p className="text-sm text-on-surface-variant">Noch nichts geloggt.</p>}
        {MEAL_SLOTS.map((sName) => {
          const rows = grouped.map.get(sName)!
          if (rows.length === 0) return null
          return <SlotGroup key={sName} title={sName} rows={rows} isPending={isPending} onDelete={(id) => go(() => removeEntry(id), 'Entfernt.')} />
        })}
        {grouped.other.length > 0 && (
          <SlotGroup title="Ohne Slot" rows={grouped.other} isPending={isPending} onDelete={(id) => go(() => removeEntry(id), 'Entfernt.')} />
        )}
      </section>
    </div>
  )
}

function Macro({
  label, ist, soll, unit = '', tone,
}: {
  label: string; ist: number; soll: number; unit?: string; tone?: Tone
}) {
  const valueColor = tone ? TONE_TEXT[tone] : 'text-on-surface'
  return (
    <div className="rounded-xl bg-surface-container-high py-2">
      <div className="flex items-center justify-center gap-1">
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${tone ? TONE_DOT[tone] : 'bg-outline-variant/40'}`} aria-hidden="true" />
        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">{label}</p>
      </div>
      <p className={`text-sm font-bold tabular-nums ${valueColor}`}>{ist}</p>
      <p className="text-[10px] text-on-surface-variant tabular-nums">/ {soll}{unit}</p>
    </div>
  )
}

function MicroPanel({
  micros,
  coverage,
}: {
  micros: Record<string, number | null>
  coverage: { present: number; total: number }
}) {
  const groups: { title: string; group: 'submakro' | 'mineral' | 'vitamin' }[] = [
    { title: 'Sub-Makros', group: 'submakro' },
    { title: 'Mineralstoffe', group: 'mineral' },
    { title: 'Vitamine', group: 'vitamin' },
  ]
  return (
    <section className="bg-surface-container rounded-2xl border border-surface-container-high p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <h3 className="font-headline text-sm font-semibold text-on-surface">Mikronährstoffe</h3>
        <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">
          {coverage.present}/{coverage.total} erfasst · best-effort
        </span>
      </div>
      <div className="space-y-4">
        {groups.map(({ title, group }) => (
          <div key={group}>
            <h4 className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">{title}</h4>
            <div className="grid grid-cols-3 gap-2">
              {MICRO_META.filter((m) => m.group === group).map((m) => {
                const v = micros[m.key]
                return (
                  <div key={m.key} className="rounded-xl bg-surface-container-high py-2 px-2 text-center">
                    <p className="text-[10px] text-on-surface-variant leading-tight">{m.label}</p>
                    {v == null ? (
                      <p className="text-sm text-outline tabular-nums" title="Keine Daten aus den Quellen">
                        –
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-on-surface tabular-nums">
                        {v}
                        <span className="text-[10px] font-normal text-on-surface-variant ml-0.5">{m.unit}</span>
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-on-surface-variant mt-3">„–“ = für diesen Tag liefert keine Quelle Daten.</p>
    </section>
  )
}

function SlotGroup({
  title, rows, isPending, onDelete,
}: {
  title: string
  rows: MealEntryResolved[]
  isPending: boolean
  onDelete: (id: string) => void
}) {
  const kcal = Math.round(rows.reduce((a, e) => a + e.kcal, 0) * 10) / 10
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <h4 className="text-xs uppercase tracking-widest text-on-surface-variant">{title}</h4>
        <span className="text-xs text-on-surface-variant tabular-nums">{kcal} kcal</span>
      </div>
      <ul className="rounded-xl border border-surface-container-high overflow-hidden divide-y divide-surface-container-high">
        {rows.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-3 px-3 py-2 bg-surface-container">
            <div className="min-w-0">
              <p className="text-sm text-on-surface truncate">
                {e.foodItem?.name ?? e.dish?.name ?? e.externalName ?? 'Eintrag'}
              </p>
              <p className="text-xs text-on-surface-variant tabular-nums">
                {e.amount} {e.unit} · {e.kcal} kcal · P{e.proteinG} KH{e.carbsG} F{e.fatG}
              </p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => onDelete(e.id)}
              className="flex-none text-xs text-error hover:opacity-80 disabled:opacity-50"
              aria-label="Löschen"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
