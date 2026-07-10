import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { openFoodFacts } from '@/lib/nutrition/providers/open-food-facts'
import { findByBarcode } from '@/lib/nutrition/food'

// Barcode-Lookup (auch von N-04/Scanner genutzt): erst lokaler Katalog
// (bereits gespeichert), dann Open Food Facts.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ barcode: string }> },
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { barcode } = await params
  const code = barcode?.trim()
  if (!code) return NextResponse.json({ error: 'Kein Barcode' }, { status: 400 })

  // 1) Lokaler Katalog (bereits gespeicherte Produkte)
  const local = await findByBarcode(code)
  if (local) return NextResponse.json({ source: 'local', item: local })

  // 2) Open Food Facts
  try {
    const off = await openFoodFacts.lookupByBarcode(code)
    if (!off) return NextResponse.json({ error: 'Produkt nicht gefunden' }, { status: 404 })
    return NextResponse.json({ source: 'off', food: off })
  } catch (e) {
    console.error('barcode lookup:', e)
    return NextResponse.json({ error: 'Lookup fehlgeschlagen' }, { status: 502 })
  }
}
