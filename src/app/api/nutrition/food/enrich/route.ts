import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { ALLOWED_IMAGE_TYPES } from '@/lib/nutrition/meal-photos'
import { saveFoodLabel, readFoodLabel, deleteFoodLabel } from '@/lib/nutrition/food-photos'
import { extractLabelNutrients } from '@/lib/nutrition/vision'

// Punkt 4: Nährwerttabellen-/Verpackungsfoto → AI-Anreicherung.
// Speichert das Bild privat, extrahiert die Werte je 100 g/ml (inkl. Mikros)
// und gibt sie zur Prüfung im Katalog-Formular zurück. Keys bleiben serverseitig.
export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
  }

  const label = form.get('label')
  if (!(label instanceof File)) {
    return NextResponse.json({ error: 'Label-Foto fehlt' }, { status: 400 })
  }
  const spec = ALLOWED_IMAGE_TYPES[label.type]
  if (!spec) {
    return NextResponse.json({ error: 'Nur JPEG, PNG oder WebP werden unterstützt' }, { status: 400 })
  }

  let filename: string
  try {
    filename = await saveFoodLabel(label)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Speichern fehlgeschlagen' }, { status: 400 })
  }

  try {
    const stored = await readFoodLabel(filename)
    if (!stored) throw new Error('Bild konnte nicht gelesen werden')
    const nutrients = await extractLabelNutrients({
      data: stored.buffer.toString('base64'),
      mediaType: spec.media,
    })
    return NextResponse.json({ labelImagePath: filename, nutrients })
  } catch (e) {
    // Kein verwaistes Bild zurücklassen, wenn die Extraktion scheitert.
    await deleteFoodLabel(filename)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Analyse fehlgeschlagen' },
      { status: 502 },
    )
  }
}
