'use client'

import { useRef, useState } from 'react'

interface AiEstimate {
  dishName: string
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  confidence: number
  note: string
  raw: unknown
}

interface Props {
  date: string
  mealSlot: string
  onLogged: (name: string) => void
}

const inputCls =
  'w-full border border-surface-container-high rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-on-surface-variant bg-surface-container'

/**
 * Foto→AI-Flow: Teller-(+ optional Speisekarten-)Foto + Titel → Schätzung →
 * Werte prüfen/korrigieren → loggen. Persistiert erst beim Bestätigen.
 */
export function PhotoEstimator({ date, mealSlot, onLogged }: Props) {
  const plateRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState<null | 'estimate' | 'log'>(null)
  const [error, setError] = useState<string | null>(null)
  const [estimate, setEstimate] = useState<AiEstimate | null>(null)

  // Editierbare Werte (Bestätigen/Korrigieren)
  const [dishName, setDishName] = useState('')
  const [kcal, setKcal] = useState('')
  const [proteinG, setProteinG] = useState('')
  const [carbsG, setCarbsG] = useState('')
  const [fatG, setFatG] = useState('')

  function currentFiles(): { plate: File | null; menu: File | null } {
    return {
      plate: plateRef.current?.files?.[0] ?? null,
      menu: menuRef.current?.files?.[0] ?? null,
    }
  }

  async function estimateNow() {
    setError(null)
    const { plate, menu } = currentFiles()
    if (!plate) {
      setError('Bitte ein Teller-Foto wählen.')
      return
    }
    const fd = new FormData()
    fd.append('plate', plate)
    if (menu) fd.append('menu', menu)
    if (title.trim()) fd.append('title', title.trim())

    setBusy('estimate')
    try {
      const res = await fetch('/api/nutrition/photo-estimate', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Schätzung fehlgeschlagen')
      const e = data.estimate as AiEstimate
      setEstimate(e)
      setDishName(e.dishName)
      setKcal(String(e.kcal))
      setProteinG(String(e.proteinG))
      setCarbsG(String(e.carbsG))
      setFatG(String(e.fatG))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Schätzung fehlgeschlagen')
    } finally {
      setBusy(null)
    }
  }

  async function logNow() {
    setError(null)
    const { plate, menu } = currentFiles()
    if (!plate) {
      setError('Teller-Foto fehlt (bitte erneut wählen).')
      return
    }
    const fd = new FormData()
    fd.append('plate', plate)
    if (menu) fd.append('menu', menu)
    fd.append('date', date)
    fd.append('mealSlot', mealSlot)
    fd.append('dishName', dishName)
    fd.append('kcal', kcal)
    fd.append('proteinG', proteinG)
    fd.append('carbsG', carbsG)
    fd.append('fatG', fatG)
    if (estimate) {
      fd.append('confidence', String(estimate.confidence))
      fd.append('aiRaw', JSON.stringify(estimate.raw))
    }

    setBusy('log')
    try {
      const res = await fetch('/api/nutrition/photo-log', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Loggen fehlgeschlagen')
      // Reset
      setEstimate(null)
      setTitle('')
      if (plateRef.current) plateRef.current.value = ''
      if (menuRef.current) menuRef.current.value = ''
      onLogged(dishName)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Loggen fehlgeschlagen')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">
            Teller-Foto *
          </label>
          <input ref={plateRef} type="file" accept="image/jpeg,image/png,image/webp"
            className="block w-full text-xs text-on-surface-variant file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-surface-container-high file:text-on-surface" />
        </div>
        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">
            Speisekarte (optional)
          </label>
          <input ref={menuRef} type="file" accept="image/jpeg,image/png,image/webp"
            className="block w-full text-xs text-on-surface-variant file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-surface-container-high file:text-on-surface" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-on-surface-variant mb-1">
          Gerichtstitel (optional)
        </label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Pad Thai mit Huhn" className={inputCls} />
      </div>

      <button type="button" onClick={estimateNow} disabled={busy !== null}
        className="px-5 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary-container disabled:opacity-50 transition-colors">
        {busy === 'estimate' ? 'Schätze…' : 'Nährwerte schätzen'}
      </button>

      {error && (
        <div className="p-3 bg-error/10 border border-error/30 rounded-lg text-sm text-error">{error}</div>
      )}

      {estimate && (
        <div className="rounded-xl bg-surface-container-high p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-on-surface-variant">
              Schätzung — prüfen &amp; korrigieren
            </p>
            <span className="text-xs text-on-surface-variant">
              Konfidenz {Math.round(estimate.confidence * 100)} %
            </span>
          </div>

          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Gericht</label>
            <input value={dishName} onChange={(e) => setDishName(e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <NumField label="Kalorien" unit="kcal" value={kcal} onChange={setKcal} />
            <NumField label="Protein" unit="g" value={proteinG} onChange={setProteinG} />
            <NumField label="Kohlenhydrate" unit="g" value={carbsG} onChange={setCarbsG} />
            <NumField label="Fett" unit="g" value={fatG} onChange={setFatG} />
          </div>
          {estimate.note && <p className="text-xs text-on-surface-variant">Annahme: {estimate.note}</p>}

          <button type="button" onClick={logNow} disabled={busy !== null}
            className="px-5 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary-container disabled:opacity-50 transition-colors">
            {busy === 'log' ? 'Logge…' : `In ${mealSlot} loggen`}
          </button>
        </div>
      )}
    </div>
  )
}

function NumField({
  label, unit, value, onChange,
}: {
  label: string; unit: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-xs text-on-surface-variant mb-1">{label} ({unit})</label>
      <input type="number" inputMode="decimal" min={0} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full border border-surface-container-high rounded-lg px-2 py-1.5 text-sm text-on-surface bg-surface-container focus:outline-none" />
    </div>
  )
}
