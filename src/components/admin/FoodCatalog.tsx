'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { FoodItem } from '@prisma/client'
import type { NormalizedFood } from '@/lib/nutrition/food-provider'
import { BarcodeScanner } from '@/components/nutrition/BarcodeScanner'
import {
  saveFoodItem,
  importFoodItem,
  deleteFoodItem,
  restoreFoodItem,
  toggleFoodFavorite,
  type FoodFormData,
} from '@/app/admin/food/actions'

const EMPTY: FoodFormData = {
  name: '', brand: '', barcode: '', baseUnit: 'g',
  kcal: '', proteinG: '', carbsG: '', fatG: '',
  fiberG: '', sugarG: '', saturatedFatG: '', sodiumMg: '', potassiumMg: '',
  ironMg: '', magnesiumMg: '', calciumMg: '', zincMg: '',
  vitaminDUg: '', vitaminB12Ug: '', vitaminCMg: '',
}

const s = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n))

function itemToForm(f: FoodItem): FoodFormData {
  return {
    id: f.id, name: f.name, brand: f.brand ?? '', barcode: f.barcode ?? '', baseUnit: f.baseUnit,
    kcal: s(f.kcal), proteinG: s(f.proteinG), carbsG: s(f.carbsG), fatG: s(f.fatG),
    fiberG: s(f.fiberG), sugarG: s(f.sugarG), saturatedFatG: s(f.saturatedFatG),
    sodiumMg: s(f.sodiumMg), potassiumMg: s(f.potassiumMg), ironMg: s(f.ironMg),
    magnesiumMg: s(f.magnesiumMg), calciumMg: s(f.calciumMg), zincMg: s(f.zincMg),
    vitaminDUg: s(f.vitaminDUg), vitaminB12Ug: s(f.vitaminB12Ug), vitaminCMg: s(f.vitaminCMg),
  }
}

const inputCls =
  'w-full border border-surface-container-high rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-on-surface-variant bg-surface-container'

function Num({
  label, unit, value, onChange, step = 'any',
}: {
  label: string; unit?: string; value: string; onChange: (v: string) => void; step?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-on-surface-variant mb-1">
        {label} {unit && <span className="font-normal">({unit})</span>}
      </label>
      <input type="number" inputMode="decimal" step={step} min={0} value={value}
        onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </div>
  )
}

interface SearchResponse {
  local: FoodItem[]
  off: NormalizedFood[]
}

export function FoodCatalog({
  catalog,
  favoriteFoodIds,
}: {
  catalog: FoodItem[]
  favoriteFoodIds: string[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const favSet = new Set(favoriteFoodIds)

  // --- Suche ----------------------------------------------------------------
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [showScanner, setShowScanner] = useState(false)

  // Barcode-Scan → Lookup (lokal, dann OFF)
  async function onBarcodeDetected(code: string) {
    setShowScanner(false)
    setMsg(null)
    try {
      const res = await fetch(`/api/nutrition/food/barcode/${encodeURIComponent(code)}`)
      if (res.status === 404) {
        setForm({ ...EMPTY, barcode: code })
        setMsg({ kind: 'err', text: `Barcode ${code} nicht gefunden — bitte manuell anlegen.` })
        return
      }
      if (!res.ok) throw new Error()
      const data = (await res.json()) as
        | { source: 'local'; item: FoodItem }
        | { source: 'off'; food: NormalizedFood }
      if (data.source === 'local') {
        setForm(itemToForm(data.item))
        setMsg({ kind: 'ok', text: `„${data.item.name}" ist bereits im Katalog (zum Bearbeiten geladen).` })
      } else {
        loadOff(data.food)
        setMsg({ kind: 'ok', text: `„${data.food.name}" gefunden — prüfen und übernehmen.` })
      }
    } catch {
      setMsg({ kind: 'err', text: 'Barcode-Lookup fehlgeschlagen.' })
    }
  }

  const runSearch = useCallback(async () => {
    if (query.trim().length < 2) return
    setSearching(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/nutrition/food/search?q=${encodeURIComponent(query.trim())}`)
      if (!res.ok) throw new Error()
      setResults((await res.json()) as SearchResponse)
    } catch {
      setMsg({ kind: 'err', text: 'Suche fehlgeschlagen.' })
    } finally {
      setSearching(false)
    }
  }, [query])

  function doImport(food: NormalizedFood) {
    setMsg(null)
    startTransition(async () => {
      const r = await importFoodItem(food)
      if (r.error) setMsg({ kind: 'err', text: r.error })
      else {
        setMsg({ kind: 'ok', text: r.info ?? 'Übernommen.' })
        router.refresh()
      }
    })
  }

  // --- Formular (anlegen / bearbeiten) --------------------------------------
  const [form, setForm] = useState<FoodFormData>(EMPTY)
  const set = (k: keyof FoodFormData) => (v: string) => setForm((f) => ({ ...f, [k]: v }))
  const editing = Boolean(form.id)

  function loadOff(food: NormalizedFood) {
    setForm({
      id: undefined, name: food.name, brand: food.brand ?? '', barcode: food.barcode ?? '',
      baseUnit: food.baseUnit, kcal: s(food.kcal), proteinG: s(food.proteinG),
      carbsG: s(food.carbsG), fatG: s(food.fatG), fiberG: s(food.fiberG), sugarG: s(food.sugarG),
      saturatedFatG: s(food.saturatedFatG), sodiumMg: s(food.sodiumMg), potassiumMg: s(food.potassiumMg),
      ironMg: s(food.ironMg), magnesiumMg: s(food.magnesiumMg), calciumMg: s(food.calciumMg),
      zincMg: s(food.zincMg), vitaminDUg: s(food.vitaminDUg), vitaminB12Ug: s(food.vitaminB12Ug),
      vitaminCMg: s(food.vitaminCMg),
    })
    setMsg(null)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function save() {
    setMsg(null)
    startTransition(async () => {
      const r = await saveFoodItem(form)
      if (r.error) setMsg({ kind: 'err', text: r.error })
      else {
        setMsg({ kind: 'ok', text: editing ? 'Gespeichert.' : 'Angelegt.' })
        setForm(EMPTY)
        router.refresh()
      }
    })
  }

  function remove(id: string) {
    startTransition(async () => {
      const r = await deleteFoodItem(id)
      if (r.error) setMsg({ kind: 'err', text: r.error })
      else {
        setMsg({ kind: 'ok', text: r.info ?? 'Entfernt.' })
        router.refresh()
      }
    })
  }

  function restore(id: string) {
    startTransition(async () => {
      await restoreFoodItem(id)
      router.refresh()
    })
  }

  function toggleFav(id: string, on: boolean) {
    startTransition(async () => {
      const r = await toggleFoodFavorite(id, on)
      if (r.error) setMsg({ kind: 'err', text: r.error })
      else router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      {msg && (
        <div
          className={`p-3 rounded-lg text-sm ${
            msg.kind === 'ok'
              ? 'bg-primary/10 border border-primary/30 text-primary'
              : 'bg-error/10 border border-error/30 text-error'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Suche (lokal + Open Food Facts) */}
      <section className="bg-surface-container rounded-2xl border border-surface-container-high p-5">
        <h3 className="font-headline text-sm font-semibold text-on-surface mb-3">
          Suche (Katalog + Open Food Facts)
        </h3>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            placeholder="Produktname oder Barcode…"
            className={inputCls}
          />
          <button
            type="button"
            onClick={runSearch}
            disabled={searching || query.trim().length < 2}
            className="flex-none px-4 py-1.5 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary-container disabled:opacity-50 transition-colors"
          >
            {searching ? '…' : 'Suchen'}
          </button>
          <button
            type="button"
            onClick={() => setShowScanner((v) => !v)}
            className="flex-none px-4 py-1.5 border border-surface-container-high text-on-surface rounded-lg text-sm font-medium hover:border-outline transition-colors"
          >
            {showScanner ? 'Scanner aus' : 'Scannen'}
          </button>
        </div>

        {showScanner && (
          <div className="mt-4">
            <BarcodeScanner onDetected={onBarcodeDetected} onClose={() => setShowScanner(false)} />
          </div>
        )}

        {results && (
          <div className="mt-4 space-y-4">
            {results.local.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">
                  Bereits im Katalog
                </p>
                <ul className="space-y-1">
                  {results.local.map((l) => (
                    <li key={l.id} className="text-sm text-on-surface-variant">
                      {l.name}
                      {l.brand ? ` · ${l.brand}` : ''} — {l.kcal} kcal
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">
                Open Food Facts ({results.off.length})
              </p>
              {results.off.length === 0 ? (
                <p className="text-sm text-on-surface-variant">Keine Treffer.</p>
              ) : (
                <ul className="space-y-2">
                  {results.off.map((r, i) => (
                    <li
                      key={`${r.barcode ?? 'n'}-${i}`}
                      className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-high px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-on-surface truncate">
                          {r.name}
                          {r.brand ? <span className="text-on-surface-variant"> · {r.brand}</span> : ''}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {r.kcal} kcal · P{r.proteinG} F{r.fatG} KH{r.carbsG}
                          {r.barcode ? ` · ${r.barcode}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-none gap-1">
                        <button
                          type="button"
                          onClick={() => loadOff(r)}
                          className="px-2.5 py-1 text-xs rounded-lg border border-surface-container-high text-on-surface-variant hover:text-on-surface hover:border-outline transition-colors"
                        >
                          Prüfen
                        </button>
                        <button
                          type="button"
                          onClick={() => doImport(r)}
                          disabled={isPending}
                          className="px-2.5 py-1 text-xs rounded-lg bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 transition-colors"
                        >
                          Übernehmen
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Anlegen / Bearbeiten */}
      <section className="bg-surface-container rounded-2xl border border-surface-container-high p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-sm font-semibold text-on-surface">
            {editing ? 'Produkt bearbeiten' : 'Produkt anlegen'}
          </h3>
          {editing && (
            <button
              type="button"
              onClick={() => setForm(EMPTY)}
              className="text-xs text-on-surface-variant hover:text-on-surface"
            >
              Abbrechen
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-on-surface-variant mb-1">Name</label>
            <input value={form.name} onChange={(e) => set('name')(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">Marke</label>
            <input value={form.brand} onChange={(e) => set('brand')(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">Basiseinheit</label>
            <select value={form.baseUnit} onChange={(e) => set('baseUnit')(e.target.value)} className={inputCls}>
              <option value="g">g</option>
              <option value="ml">ml</option>
              <option value="stück">Stück</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-on-surface-variant mb-1">Barcode</label>
            <input value={form.barcode} onChange={(e) => set('barcode')(e.target.value)} className={inputCls} />
          </div>
        </div>

        <p className="text-xs text-on-surface-variant pt-1">Nährwerte je 100 {form.baseUnit} · Makros Pflicht</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Num label="Kalorien" unit="kcal" value={form.kcal} onChange={set('kcal')} />
          <Num label="Protein" unit="g" value={form.proteinG} onChange={set('proteinG')} />
          <Num label="Kohlenhydrate" unit="g" value={form.carbsG} onChange={set('carbsG')} />
          <Num label="Fett" unit="g" value={form.fatG} onChange={set('fatG')} />
        </div>

        <details>
          <summary className="text-xs text-on-surface-variant cursor-pointer select-none">
            Mikronährstoffe (optional)
          </summary>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
            <Num label="Ballaststoffe" unit="g" value={form.fiberG} onChange={set('fiberG')} />
            <Num label="Zucker" unit="g" value={form.sugarG} onChange={set('sugarG')} />
            <Num label="ges. Fettsäuren" unit="g" value={form.saturatedFatG} onChange={set('saturatedFatG')} />
            <Num label="Natrium" unit="mg" value={form.sodiumMg} onChange={set('sodiumMg')} />
            <Num label="Kalium" unit="mg" value={form.potassiumMg} onChange={set('potassiumMg')} />
            <Num label="Eisen" unit="mg" value={form.ironMg} onChange={set('ironMg')} />
            <Num label="Magnesium" unit="mg" value={form.magnesiumMg} onChange={set('magnesiumMg')} />
            <Num label="Calcium" unit="mg" value={form.calciumMg} onChange={set('calciumMg')} />
            <Num label="Zink" unit="mg" value={form.zincMg} onChange={set('zincMg')} />
            <Num label="Vitamin D" unit="µg" value={form.vitaminDUg} onChange={set('vitaminDUg')} />
            <Num label="Vitamin B12" unit="µg" value={form.vitaminB12Ug} onChange={set('vitaminB12Ug')} />
            <Num label="Vitamin C" unit="mg" value={form.vitaminCMg} onChange={set('vitaminCMg')} />
          </div>
        </details>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium hover:bg-primary-container disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Speichern…' : editing ? 'Änderungen speichern' : 'Produkt anlegen'}
          </button>
        </div>
      </section>

      {/* Katalog */}
      <section>
        <h3 className="font-headline text-base font-semibold text-on-surface mb-3">
          Katalog ({catalog.length})
        </h3>
        {catalog.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Noch keine Produkte.</p>
        ) : (
          <div className="bg-surface-container rounded-2xl border border-surface-container-high overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-container text-on-surface-variant text-left">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">kcal</th>
                    <th className="px-4 py-3 font-medium">P/KH/F</th>
                    <th className="px-4 py-3 font-medium">Quelle</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {catalog.map((f) => (
                    <tr
                      key={f.id}
                      className={`border-b border-surface-container last:border-0 ${f.isActive ? '' : 'opacity-50'}`}
                    >
                      <td className="px-4 py-3 text-on-surface">
                        {f.name}
                        {f.brand ? <span className="text-on-surface-variant"> · {f.brand}</span> : ''}
                        {!f.isActive && <span className="ml-2 text-[10px] uppercase text-on-surface-variant">archiviert</span>}
                      </td>
                      <td className="px-4 py-3 text-on-surface tabular-nums">{f.kcal}</td>
                      <td className="px-4 py-3 text-on-surface-variant tabular-nums">
                        {f.proteinG}/{f.carbsG}/{f.fatG}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-1.5 py-0.5 bg-surface-container-high text-on-surface-variant rounded">
                          {f.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => toggleFav(f.id, !favSet.has(f.id))}
                          disabled={isPending}
                          className={`mr-3 ${favSet.has(f.id) ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'} disabled:opacity-50`}
                          title="Favorit"
                          aria-label="Favorit"
                        >
                          {favSet.has(f.id) ? '★' : '☆'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm(itemToForm(f))}
                          className="text-on-surface-variant hover:text-on-surface mr-3"
                        >
                          Bearbeiten
                        </button>
                        {f.isActive ? (
                          <button
                            type="button"
                            onClick={() => remove(f.id)}
                            disabled={isPending}
                            className="text-error hover:opacity-80 disabled:opacity-50"
                          >
                            Entfernen
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => restore(f.id)}
                            disabled={isPending}
                            className="text-primary hover:opacity-80 disabled:opacity-50"
                          >
                            Reaktivieren
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
