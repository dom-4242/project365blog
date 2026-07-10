import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { openFoodFacts } from '@/lib/nutrition/providers/open-food-facts'
import { searchLocalFoodItems } from '@/lib/nutrition/food'

// Serverseitiger Proxy: hält externe Provider (und spätere Keys) vom Client fern.
export async function GET(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) {
    return NextResponse.json({ local: [], off: [] })
  }

  try {
    const [local, off] = await Promise.all([
      searchLocalFoodItems(q),
      openFoodFacts.searchByText(q).catch((e) => {
        console.error('OFF search:', e)
        return []
      }),
    ])
    return NextResponse.json({ local, off })
  } catch (e) {
    console.error('food search:', e)
    return NextResponse.json({ error: 'Suche fehlgeschlagen' }, { status: 502 })
  }
}
