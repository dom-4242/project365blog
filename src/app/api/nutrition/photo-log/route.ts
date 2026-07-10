import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { saveMealPhoto } from '@/lib/nutrition/meal-photos'
import { logPhotoMeal, type PhotoInput } from '@/lib/nutrition/meals'
import { dateOnly } from '@/lib/nutrition/day'

function num(form: FormData, key: string): number {
  const v = parseFloat(String(form.get(key) ?? '').replace(',', '.'))
  return isNaN(v) ? 0 : Math.max(0, v)
}

// Persistiert die (bestätigten/korrigierten) Foto-Schätzwerte:
// speichert die Bilder und legt MealEntry (PHOTO_AI) + MealPhoto(s) an.
export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
  }

  const dateStr = String(form.get('date') ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: 'Datum ungültig' }, { status: 400 })
  }
  const plate = form.get('plate')
  if (!(plate instanceof File)) {
    return NextResponse.json({ error: 'Teller-Foto fehlt' }, { status: 400 })
  }
  const menu = form.get('menu')
  const mealSlot = (form.get('mealSlot') as string | null)?.trim() || null
  const dishName = (form.get('dishName') as string | null)?.trim() || 'Geschätzte Mahlzeit'

  let aiAnalysis: unknown = undefined
  const rawStr = form.get('aiRaw')
  if (typeof rawStr === 'string' && rawStr) {
    try {
      aiAnalysis = JSON.parse(rawStr)
    } catch {
      aiAnalysis = { raw: rawStr }
    }
  }
  const confidenceVal = form.get('confidence')
  const confidence = confidenceVal != null ? num(form, 'confidence') : null

  try {
    const photos: PhotoInput[] = []
    const plateName = await saveMealPhoto(plate)
    photos.push({ filename: plateName, photoType: 'PLATE', aiAnalysis, aiConfidence: confidence })
    if (menu instanceof File) {
      const menuName = await saveMealPhoto(menu)
      photos.push({ filename: menuName, photoType: 'MENU' })
    }

    const entry = await logPhotoMeal({
      date: dateOnly(dateStr),
      mealSlot,
      externalName: dishName,
      kcal: num(form, 'kcal'),
      proteinG: num(form, 'proteinG'),
      carbsG: num(form, 'carbsG'),
      fatG: num(form, 'fatG'),
      photos,
    })
    return NextResponse.json({ ok: true, id: entry.id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Loggen fehlgeschlagen'
    console.error('photo-log:', e)
    const status = msg.includes('unterstützt') || msg.includes('maximal') ? 422 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
