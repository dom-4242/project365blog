// =============================================================================
// Speicherung der FoodItem-Label-/Verpackungsfotos (Punkt 4)
// Bilder liegen ausserhalb von public/ → nur über geschützte Admin-Route
// abrufbar. Nutzt dieselben Typ-/Grössen-Regeln wie die Mahlzeiten-Fotos.
// =============================================================================

import { writeFile, mkdir, readFile, unlink } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, MIME_BY_EXT } from './meal-photos'

export const FOOD_LABEL_DIR = path.join(process.cwd(), 'private', 'food-labels')

/** Persistiert ein hochgeladenes Label-Bild und gibt den Dateinamen zurück. */
export async function saveFoodLabel(file: File): Promise<string> {
  const spec = ALLOWED_IMAGE_TYPES[file.type]
  if (!spec) throw new Error('Nur JPEG, PNG oder WebP werden unterstützt')
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Bild darf maximal 12 MB gross sein')

  const filename = `${crypto.randomUUID()}${spec.ext}`
  await mkdir(FOOD_LABEL_DIR, { recursive: true })
  const bytes = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(FOOD_LABEL_DIR, filename), bytes)
  return filename
}

/** Liest ein gespeichertes Label-Bild (mit Path-Traversal-Schutz). */
export async function readFoodLabel(
  filename: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const filePath = path.resolve(FOOD_LABEL_DIR, filename)
  if (!filePath.startsWith(FOOD_LABEL_DIR + path.sep)) return null
  try {
    const buffer = await readFile(filePath)
    const ext = path.extname(filename).toLowerCase()
    return { buffer, contentType: MIME_BY_EXT[ext] ?? 'application/octet-stream' }
  } catch {
    return null
  }
}

/** Löscht ein Label-Bild (best-effort, z.B. bei fehlgeschlagener Extraktion). */
export async function deleteFoodLabel(filename: string): Promise<void> {
  const filePath = path.resolve(FOOD_LABEL_DIR, filename)
  if (!filePath.startsWith(FOOD_LABEL_DIR + path.sep)) return
  try {
    await unlink(filePath)
  } catch {
    // ignore
  }
}
