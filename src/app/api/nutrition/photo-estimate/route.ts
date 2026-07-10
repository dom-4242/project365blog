import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { estimateFromPhotos, type VisionImage } from '@/lib/nutrition/vision'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '@/lib/nutrition/meal-photos'

async function toVisionImage(file: File): Promise<VisionImage> {
  const spec = ALLOWED_IMAGE_TYPES[file.type]
  if (!spec) throw new Error('Nur JPEG, PNG oder WebP werden unterstützt')
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Bild darf maximal 12 MB gross sein')
  const data = Buffer.from(await file.arrayBuffer()).toString('base64')
  return { data, mediaType: spec.media }
}

// Schätzt Nährwerte aus Foto(s) — persistiert noch nichts (das passiert beim
// Bestätigen über /api/nutrition/photo-log). Keys bleiben serverseitig.
export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
  }

  const plate = form.get('plate')
  if (!(plate instanceof File)) {
    return NextResponse.json({ error: 'Teller-Foto fehlt' }, { status: 400 })
  }
  const menu = form.get('menu')
  const title = (form.get('title') as string | null)?.trim() || null

  try {
    const plateImg = await toVisionImage(plate)
    const menuImg = menu instanceof File ? await toVisionImage(menu) : null
    const estimate = await estimateFromPhotos({ plate: plateImg, menu: menuImg, title })
    return NextResponse.json({ estimate })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Schätzung fehlgeschlagen'
    console.error('photo-estimate:', e)
    const status = msg.includes('unterstützt') || msg.includes('maximal') ? 422 : 502
    return NextResponse.json({ error: msg }, { status })
  }
}
