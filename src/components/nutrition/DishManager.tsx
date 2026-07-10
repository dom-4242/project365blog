'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { FoodItem } from '@prisma/client'
import { dishSnapshot } from '@/lib/nutrition/snapshot'
import type { DishWithItems } from '@/lib/nutrition/dishes'
import {
  saveDish,
  deleteDishAction,
  toggleDishFavorite,
  type DishFormData,
} from '@/app/admin/dishes/actions'

interface Props {
  dishes: DishWithItems[]
  catalog: FoodItem[]
  favoriteDishIds: string[]
}

interface Row {
  foodItemId: string
  amount: string
  unit: string
}

const inputCls =
  'w-full border border-surface-container-high rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-on-surface-variant bg-surface-container'

export function DishManager({ dishes, catalog, favoriteDishIds }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const foodById = useMemo(() => new Map(catalog.map((f) => [f.id, f])), [catalog])
  const favSet = useMemo(() => new Set(favoriteDishIds), [favoriteDishIds])

  const [id, setId] = useState<string | undefined>(undefined)
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [rows, setRows] = useState<Row[]>([{ foodItemId: '', amount: '', unit: 'g' }])

  const editing = Boolean(id)

  function reset() {
    setId(undefined); setName(''); setNote(''); setRows([{ foodItemId: '', amount: '', unit: 'g' }])
  }

  function loadDish(d: DishWithItems) {
    setId(d.id); setName(d.name); setNote(d.note ?? '')
    setRows(d.items.map((i) => ({ foodItemId: i.foodItemId, amount: String(i.amount), unit: i.unit })))
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Live-Nährwertsumme
  const preview = useMemo(() => {
    const components = rows
      .filter((r) => r.foodItemId && parseFloat(r.amount.replace(',', '.')) > 0)
      .map((r) => ({ food: foodById.get(r.foodItemId)!, amount: parseFloat(r.amount.replace(',', '.')) }))
      .filter((c) => c.food)
    return components.length ? dishSnapshot(components) : null
  }, [rows, foodById])

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }
  function addRow() { setRows((rs) => [...rs, { foodItemId: '', amount: '', unit: 'g' }]) }
  function removeRow(i: number) { setRows((rs) => rs.filter((_, idx) => idx !== i)) }

  function save() {
    setMsg(null)
    const data: DishFormData = {
      id, name, note,
      items: rows.map((r) => ({ foodItemId: r.foodItemId, amount: r.amount, unit: r.unit })),
    }
    startTransition(async () => {
      const r = await saveDish(data)
      if (r.error) setMsg({ kind: 'err', text: r.error })
      else { setMsg({ kind: 'ok', text: editing ? 'Gespeichert.' : 'Gericht angelegt.' }); reset(); router.refresh() }
    })
  }

  function run(fn: () => Promise<{ error?: string; success?: boolean; info?: string }>) {
    startTransition(async () => {
      const r = await fn()
      if (r.error) setMsg({ kind: 'err', text: r.error })
      else { if (r.info) setMsg({ kind: 'ok', text: r.info }); router.refresh() }
    })
  }

  return (
    <div className="space-y-8">
      {msg && (
        <div className={`p-3 rounded-lg text-sm ${msg.kind === 'ok' ? 'bg-primary/10 border border-primary/30 text-primary' : 'bg-error/10 border border-error/30 text-error'}`}>
          {msg.text}
        </div>
      )}

      {/* Formular */}
      <section className="bg-surface-container rounded-2xl border border-surface-container-high p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-sm font-semibold text-on-surface">
            {editing ? 'Gericht bearbeiten' : 'Gericht anlegen'}
          </h3>
          {editing && <button type="button" onClick={reset} className="text-xs text-on-surface-variant hover:text-on-surface">Abbrechen</button>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-on-surface-variant mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Mein Frühstück" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1">Notiz</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-on-surface-variant mb-2">Zutaten</p>
          {catalog.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Erst Lebensmittel im Katalog anlegen.</p>
          ) : (
            <div className="space-y-2">
              {rows.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <select value={r.foodItemId} onChange={(e) => updateRow(i, { foodItemId: e.target.value, unit: foodById.get(e.target.value)?.baseUnit ?? 'g' })} className={inputCls}>
                    <option value="">– Lebensmittel –</option>
                    {catalog.map((f) => <option key={f.id} value={f.id}>{f.name}{f.brand ? ` · ${f.brand}` : ''}</option>)}
                  </select>
                  <input type="number" inputMode="decimal" value={r.amount} onChange={(e) => updateRow(i, { amount: e.target.value })}
                    placeholder="Menge" className="w-28 border border-surface-container-high rounded-lg px-2 py-1.5 text-sm text-on-surface bg-surface-container focus:outline-none" />
                  <span className="flex items-center text-xs text-on-surface-variant w-10">{r.unit}</span>
                  <button type="button" onClick={() => removeRow(i)} className="flex-none text-on-surface-variant hover:text-error px-2">✕</button>
                </div>
              ))}
              <button type="button" onClick={addRow} className="text-xs text-primary hover:opacity-80">+ Zutat</button>
            </div>
          )}
        </div>

        {preview && (
          <div className="rounded-xl bg-surface-container-high p-3 text-sm text-on-surface">
            Summe: <span className="font-bold text-primary">{preview.kcal} kcal</span>
            <span className="text-on-surface-variant"> · P {preview.proteinG} g · KH {preview.carbsG} g · F {preview.fatG} g</span>
          </div>
        )}

        <div className="flex justify-end">
          <button type="button" onClick={save} disabled={isPending}
            className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium hover:bg-primary-container disabled:opacity-50 transition-colors">
            {isPending ? 'Speichern…' : editing ? 'Änderungen speichern' : 'Gericht anlegen'}
          </button>
        </div>
      </section>

      {/* Liste */}
      <section>
        <h3 className="font-headline text-base font-semibold text-on-surface mb-3">Gerichte ({dishes.length})</h3>
        {dishes.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Noch keine Gerichte.</p>
        ) : (
          <ul className="space-y-2">
            {dishes.map((d) => {
              const totals = dishSnapshot(d.items.map((i) => ({ food: i.foodItem, amount: i.amount })))
              const isFav = favSet.has(d.id)
              return (
                <li key={d.id} className={`rounded-xl border border-surface-container-high bg-surface-container p-3 ${d.isActive ? '' : 'opacity-50'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-on-surface">
                        {d.name}
                        {!d.isActive && <span className="ml-2 text-[10px] uppercase text-on-surface-variant">archiviert</span>}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {d.items.length} Zutaten · {totals.kcal} kcal · P{totals.proteinG} KH{totals.carbsG} F{totals.fatG}
                      </p>
                    </div>
                    <div className="flex flex-none items-center gap-3 text-xs">
                      <button type="button" onClick={() => run(() => toggleDishFavorite(d.id, !isFav))} disabled={isPending}
                        className={isFav ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'} title="Favorit" aria-label="Favorit">
                        {isFav ? '★' : '☆'}
                      </button>
                      <button type="button" onClick={() => loadDish(d)} className="text-on-surface-variant hover:text-on-surface">Bearbeiten</button>
                      <button type="button" onClick={() => run(() => deleteDishAction(d.id))} disabled={isPending} className="text-error hover:opacity-80 disabled:opacity-50">Entfernen</button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
