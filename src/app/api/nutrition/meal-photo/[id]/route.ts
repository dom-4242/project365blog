import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { readMealPhoto } from '@/lib/nutrition/meal-photos'

// Geschützte Auslieferung eines Mahlzeiten-Fotos (liegt ausserhalb public/).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin()
  if (!session) return new NextResponse('Nicht autorisiert', { status: 401 })

  const { id } = await params
  const photo = await prisma.mealPhoto.findUnique({ where: { id } })
  if (!photo) return new NextResponse('Not Found', { status: 404 })

  const file = await readMealPhoto(photo.imagePath)
  if (!file) return new NextResponse('Not Found', { status: 404 })

  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  })
}
