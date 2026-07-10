'use client'

import { useEffect, useRef, useState } from 'react'
import type { IScannerControls } from '@zxing/browser'

interface BarcodeScannerProps {
  /** Wird mit dem erkannten (oder manuell eingegebenen) Barcode aufgerufen. */
  onDetected: (barcode: string) => void
  onClose?: () => void
}

type Status = 'starting' | 'scanning' | 'error'

/**
 * Mobile-first Barcode-Scanner (Handy-Kamera) auf Basis von @zxing/browser.
 * Der Reader wird dynamisch importiert (nur im Browser), damit die Komponente
 * SSR-sicher bleibt. Fallback: manuelle Eingabe des Barcodes.
 */
export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const doneRef = useRef(false)

  const [status, setStatus] = useState<Status>('starting')
  const [error, setError] = useState<string | null>(null)
  const [manual, setManual] = useState('')

  function stop() {
    controlsRef.current?.stop()
    controlsRef.current = null
  }

  function handleCode(code: string) {
    if (doneRef.current) return
    doneRef.current = true
    stop()
    onDetected(code)
  }

  useEffect(() => {
    let cancelled = false

    async function start() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        if (cancelled) return
        const reader = new BrowserMultiFormatReader()
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } } },
          videoRef.current!,
          (result) => {
            if (result) handleCode(result.getText())
          },
        )
        if (cancelled) {
          controls.stop()
          return
        }
        controlsRef.current = controls
        setStatus('scanning')
      } catch (e) {
        if (cancelled) return
        const err = e as { name?: string }
        if (err.name === 'NotAllowedError') {
          setError('Kamerazugriff verweigert. Barcode unten manuell eingeben.')
        } else if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
          setError('Keine passende Kamera gefunden. Barcode unten manuell eingeben.')
        } else {
          setError('Scanner nicht verfügbar. Barcode unten manuell eingeben.')
        }
        setStatus('error')
      }
    }

    start()
    return () => {
      cancelled = true
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="rounded-2xl border border-surface-container-high bg-surface-container p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-headline text-sm font-semibold text-on-surface">Barcode scannen</h4>
        {onClose && (
          <button
            type="button"
            onClick={() => {
              stop()
              onClose()
            }}
            className="text-xs text-on-surface-variant hover:text-on-surface"
          >
            Schliessen
          </button>
        )}
      </div>

      {status !== 'error' && (
        <div className="relative overflow-hidden rounded-xl bg-black aspect-[4/3] max-w-sm mx-auto">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
            autoPlay
          />
          {/* Ziel-Rahmen */}
          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-primary/70" />
          {status === 'starting' && (
            <div className="absolute inset-0 grid place-items-center text-xs text-white/70">
              Kamera wird gestartet…
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-on-surface-variant text-center">{error}</p>}
      {status === 'scanning' && (
        <p className="text-xs text-on-surface-variant text-center">
          Barcode in den Rahmen halten.
        </p>
      )}

      {/* Fallback: manuelle Eingabe */}
      <div className="flex gap-2 pt-1">
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && manual.trim() && handleCode(manual.trim())}
          inputMode="numeric"
          placeholder="Barcode manuell eingeben…"
          className="w-full border border-surface-container-high rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-on-surface-variant bg-surface-container"
        />
        <button
          type="button"
          onClick={() => manual.trim() && handleCode(manual.trim())}
          disabled={!manual.trim()}
          className="flex-none px-4 py-1.5 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary-container disabled:opacity-50 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  )
}
