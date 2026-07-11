'use client'

import { useEffect, useRef, useState } from 'react'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { computeCropRect } from '@/lib/nutrition/crop'

interface Props {
  file: File
  onCancel: () => void
  onCropped: (file: File) => void
}

/**
 * Zuschneide-Modal fürs Speisekarten-Foto (Punkt 2). Der Nutzer wählt nur das
 * relevante Gericht aus; das clientseitig zugeschnittene Bild ersetzt das
 * Menü-Foto für die AI-Schätzung (schärferer Kontext, weniger Verwirrung).
 */
export function MenuCropModal({ file, onCancel, onCropped }: Props) {
  const [url] = useState(() => URL.createObjectURL(file))
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completed, setCompleted] = useState<PixelCrop>()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    return () => URL.revokeObjectURL(url)
  }, [url])

  function close() {
    onCancel()
  }

  function apply() {
    const image = imgRef.current
    if (!image || !completed || completed.width === 0 || completed.height === 0) return
    setBusy(true)

    const rect = computeCropRect(
      { x: completed.x, y: completed.y, width: completed.width, height: completed.height },
      {
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        displayWidth: image.width,
        displayHeight: image.height,
      },
    )

    const canvas = document.createElement('canvas')
    canvas.width = rect.outW
    canvas.height = rect.outH
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setBusy(false)
      return
    }
    ctx.drawImage(image, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, rect.outW, rect.outH)

    canvas.toBlob(
      (blob) => {
        setBusy(false)
        if (!blob) return
        const base = file.name.replace(/\.[^.]+$/, '')
        onCropped(new File([blob], `${base}-crop.jpg`, { type: 'image/jpeg' }))
      },
      'image/jpeg',
      0.92,
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Speisekarte zuschneiden"
    >
      <div className="bg-surface-container rounded-2xl border border-outline-variant/15 max-w-lg w-full max-h-[90vh] overflow-auto p-4 space-y-3">
        <div>
          <p className="text-sm font-headline font-semibold text-on-surface">Speisekarte zuschneiden</p>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Nur das gewünschte Gericht markieren — das schärft den Kontext für die AI.
          </p>
        </div>

        <div className="flex justify-center bg-surface-container-low rounded-lg overflow-hidden">
          <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompleted(c)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={imgRef} src={url} alt="Speisekarte" className="max-h-[60vh] w-auto" />
          </ReactCrop>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={busy || !completed?.width}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary-container disabled:opacity-50 transition-colors"
          >
            {busy ? 'Schneide…' : 'Übernehmen'}
          </button>
        </div>
      </div>
    </div>
  )
}
