// =============================================================================
// Speicherung der Mahlzeiten-Fotos (N-06)
// Bilder liegen ausserhalb von public/ → nur über geschützte Route abrufbar.
// =============================================================================

import { writeFile, mkdir, readFile } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import type { VisionMediaType } from './vision'

export const MEAL_PHOTO_DIR = path.join(process.cwd(), 'private', 'meal-photos')

export const ALLOWED_IMAGE_TYPES: Record<string, { ext: string; media: VisionMediaType }> = {
  'image/jpeg': { ext: '.jpg', media: 'image/jpeg' },
  'image/jpg': { ext: '.jpg', media: 'image/jpeg' },
  'image/png': { ext: '.png', media: 'image/png' },
  'image/webp': { ext: '.webp', media: 'image/webp' },
}

export const MAX_IMAGE_BYTES = 12 * 1024 * 1024 // 12 MB

export const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

/** Persistiert eine hochgeladene Bilddatei und gibt den Dateinamen zurück. */
export async function saveMealPhoto(file: File): Promise<string> {
  const spec = ALLOWED_IMAGE_TYPES[file.type]
  if (!spec) throw new Error('Nur JPEG, PNG oder WebP werden unterstützt')
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Bild darf maximal 12 MB gross sein')

  const filename = `${crypto.randomUUID()}${spec.ext}`
  await mkdir(MEAL_PHOTO_DIR, { recursive: true })
  const bytes = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(MEAL_PHOTO_DIR, filename), bytes)
  return filename
}

/** Liest eine gespeicherte Datei (mit Path-Traversal-Schutz). */
export async function readMealPhoto(filename: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const filePath = path.resolve(MEAL_PHOTO_DIR, filename)
  if (!filePath.startsWith(MEAL_PHOTO_DIR + path.sep)) return null
  try {
    const buffer = await readFile(filePath)
    const ext = path.extname(filename).toLowerCase()
    return { buffer, contentType: MIME_BY_EXT[ext] ?? 'application/octet-stream' }
  } catch {
    return null
  }
}
