'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { FoodItem } from '@prisma/client'
import { MEAL_SLOTS, type MealSlot } from '@/lib/nutrition/constants'
import type { MealEntryResolved, DayTotals } from '@/lib/nutrition/meals'
import type { FavoriteResolved } from '@/lib/nutrition/favorites'
import type { DishWithItems } from '@/lib/nutrition/dishes'
import { BarcodeScanner } from '@/components/nutrition/BarcodeScanner'
import { PhotoEstimator } from '@/components/nutrition/PhotoEstimator'
import {
  logFoodEntry,
  logDishEntry,
  quickLogFavorite,
  logScannedBarcode,
  removeEntry,
} from '@/app/admin/log/actions'

interface Props {
  date: string
  entries: MealEntryResolved[]
  favorites: FavoriteResolved[]
  dishes: DishWithItems[]
  totals: DayTotals
  targetKcal: number | null
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

export function MealLogger({ date, entries, favorites, dishes, totals, targetKcal }: Props) {
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

  const remaining = targetKcal != null ? Math.round((targetKcal - totals.kcal) * 10) / 10 : null

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

      {/* Tagesbilanz */}
      <section className="bg-surface-container rounded-2xl border border-surface-container-high p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-1">
          <h3 className="font-headline text-sm font-semibold text-on-surface">Tagesbilanz (IST)</h3>
          <div className="text-sm text-on-surface tabular-nums">
            <span className="font-bold text-primary">{totals.kcal}</span>
            {targetKcal != null && <span className="text-on-surface-variant"> / {targetKcal} kcal</span>}
          </div>
        </div>
        <p className="text-xs text-on-surface-variant">
          P {totals.proteinG} g · KH {totals.carbsG} g · F {totals.fatG} g
          {remaining != null && <> · Rest {remaining} kcal</>}
        </p>
      </section>

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
