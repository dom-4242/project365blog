import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { readFoodLabel } from '@/lib/nutrition/food-photos'

// Geschützte Auslieferung eines FoodItem-Label-Fotos (liegt ausserhalb public/).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const session = await requireAdmin()
  if (!session) return new NextResponse('Nicht autorisiert', { status: 401 })

  const { filename } = await params
  const file = await readFoodLabel(filename)
  if (!file) return new NextResponse('Not Found', { status: 404 })

  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  })
}
