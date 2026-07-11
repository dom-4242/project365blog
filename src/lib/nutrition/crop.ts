// =============================================================================
// Crop-Geometrie (Punkt 2) — reine, testbare Umrechnung.
//
// react-image-crop liefert die Auswahl in *angezeigten* Bildpixeln. Fürs
// verlustfreie Zuschneiden muss auf die native Bildauflösung skaliert werden.
// =============================================================================

export interface CropRectInput {
  /** Auswahl in angezeigten Bildpixeln. */
  x: number
  y: number
  width: number
  height: number
}

export interface ImageDims {
  naturalWidth: number
  naturalHeight: number
  displayWidth: number
  displayHeight: number
}

export interface SourceRect {
  sx: number
  sy: number
  sw: number
  sh: number
  outW: number
  outH: number
}

/**
 * Rechnet eine Auswahl (angezeigte Pixel) in einen Quell-Ausschnitt der nativen
 * Auflösung um (für ctx.drawImage). Clamped auf die Bildgrenzen; min. 1px.
 */
export function computeCropRect(crop: CropRectInput, dims: ImageDims): SourceRect {
  const scaleX = dims.displayWidth > 0 ? dims.naturalWidth / dims.displayWidth : 1
  const scaleY = dims.displayHeight > 0 ? dims.naturalHeight / dims.displayHeight : 1

  let sx = Math.round(crop.x * scaleX)
  let sy = Math.round(crop.y * scaleY)
  let sw = Math.round(crop.width * scaleX)
  let sh = Math.round(crop.height * scaleY)

  sx = Math.max(0, Math.min(sx, dims.naturalWidth - 1))
  sy = Math.max(0, Math.min(sy, dims.naturalHeight - 1))
  sw = Math.max(1, Math.min(sw, dims.naturalWidth - sx))
  sh = Math.max(1, Math.min(sh, dims.naturalHeight - sy))

  return { sx, sy, sw, sh, outW: sw, outH: sh }
}
