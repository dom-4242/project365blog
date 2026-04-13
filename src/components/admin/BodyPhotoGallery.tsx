'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Category = 'FRONT' | 'SIDE' | 'BACK'

interface Photo {
  id: string
  date: string
  category: Category
  notes: string | null
}

const CATEGORY_LABEL: Record<Category, string> = {
  FRONT: 'Vorne',
  SIDE: 'Seite',
  BACK: 'Rücken',
}

const CATEGORIES: Category[] = ['FRONT', 'SIDE', 'BACK']

interface BodyPhotoGalleryProps {
  photos: Photo[]
  todayDate: string
}

export function BodyPhotoGallery({ photos, todayDate }: BodyPhotoGalleryProps) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [uploadDate, setUploadDate] = useState(todayDate)
  const [uploadCategory, setUploadCategory] = useState<Category>('FRONT')
  const [uploadNotes, setUploadNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<Category | 'ALL'>('ALL')
  const [compareIds, setCompareIds] = useState<[string | null, string | null]>([null, null])
  const [compareMode, setCompareMode] = useState(false)

  const filtered = filterCategory === 'ALL' ? photos : photos.filter((p) => p.category === filterCategory)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('date', uploadDate)
    fd.append('category', uploadCategory)
    fd.append('notes', uploadNotes)

    const res = await fetch('/api/admin/body-photos', { method: 'POST', body: fd })
    const data = await res.json() as { id?: string; error?: string }
    setUploading(false)

    if (!res.ok || !data.id) {
      setError(data.error ?? 'Upload fehlgeschlagen')
    } else {
      setUploadNotes('')
      router.refresh()
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleDelete(id: string) {
    if (!confirm('Foto löschen?')) return
    startTransition(async () => {
      await fetch('/api/admin/body-photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      router.refresh()
    })
  }

  function toggleCompare(id: string) {
    setCompareIds(([a, b]) => {
      if (a === id) return [null, b]
      if (b === id) return [a, null]
      if (!a) return [id, b]
      if (!b) return [a, id]
      return [id, b] // replace first
    })
  }

  const comparePhoto1 = photos.find((p) => p.id === compareIds[0])
  const comparePhoto2 = photos.find((p) => p.id === compareIds[1])

  return (
    <div className="space-y-8">
      {/* Upload */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Foto hochladen</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Datum</label>
            <input type="date" value={uploadDate} onChange={(e) => setUploadDate(e.target.value)}
              className="border border-surface-container-high rounded-lg px-3 py-1.5 text-sm bg-surface-container text-on-surface focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Kategorie</label>
            <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value as Category)}
              className="border border-surface-container-high rounded-lg px-3 py-1.5 text-sm bg-surface-container text-on-surface focus:outline-none">
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-on-surface-variant mb-1">Notiz (optional)</label>
            <input type="text" value={uploadNotes} onChange={(e) => setUploadNotes(e.target.value)} placeholder="z.B. nach Training"
              className="w-full border border-surface-container-high rounded-lg px-3 py-1.5 text-sm bg-surface-container text-on-surface focus:outline-none" />
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Lädt hoch…' : '+ Foto wählen'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
      </section>

      {/* Filter + Vergleich Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1">
          {(['ALL', ...CATEGORIES] as const).map((cat) => (
            <button key={cat} onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filterCategory === cat ? 'bg-surface-container text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}>
              {cat === 'ALL' ? 'Alle' : CATEGORY_LABEL[cat]}
            </button>
          ))}
        </div>
        <button onClick={() => { setCompareMode((v) => !v); setCompareIds([null, null]) }}
          className={`text-xs px-3 py-1 rounded-lg transition-colors ${compareMode ? 'bg-primary text-white' : 'border border-outline-variant text-on-surface-variant hover:text-on-surface'}`}>
          Vergleich {compareMode ? 'beenden' : 'starten'}
        </button>
      </div>

      {/* Vergleichsansicht */}
      {compareMode && (comparePhoto1 || comparePhoto2) && (
        <div className="grid grid-cols-2 gap-4">
          {([comparePhoto1, comparePhoto2] as const).map((p, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant/20 relative">
              {p ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/admin/body-photos/${p.id}`} alt="" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-xs text-white">
                    {p.date} · {CATEGORY_LABEL[p.category]}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-on-surface-variant">
                  {i === 0 ? 'Erstes Foto wählen' : 'Zweites Foto wählen'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Galerie */}
      {filtered.length === 0 ? (
        <p className="text-sm text-on-surface-variant">Noch keine Fotos</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((photo) => {
            const isSelected = compareIds.includes(photo.id)
            return (
              <div key={photo.id} className={`relative group rounded-xl overflow-hidden aspect-[3/4] bg-surface-container-low border transition-all ${isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-outline-variant/20'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/admin/body-photos/${photo.id}`}
                  alt={`${photo.date} ${CATEGORY_LABEL[photo.category]}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100">
                  <div className="flex justify-between">
                    {compareMode && (
                      <button onClick={() => toggleCompare(photo.id)}
                        className={`text-xs px-2 py-0.5 rounded font-medium ${isSelected ? 'bg-primary text-white' : 'bg-white/20 text-white'}`}>
                        {isSelected ? '✓ Gewählt' : 'Wählen'}
                      </button>
                    )}
                    <button onClick={() => handleDelete(photo.id)} disabled={isPending}
                      className="ml-auto text-white/80 hover:text-white">
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 0" }}>delete</span>
                    </button>
                  </div>
                  <div className="text-xs text-white/90">
                    <p>{photo.date}</p>
                    <p>{CATEGORY_LABEL[photo.category]}</p>
                    {photo.notes && <p className="truncate opacity-80">{photo.notes}</p>}
                  </div>
                </div>
                {/* Category badge */}
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/50 rounded text-[10px] text-white font-medium group-hover:opacity-0 transition-opacity">
                  {CATEGORY_LABEL[photo.category]}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
