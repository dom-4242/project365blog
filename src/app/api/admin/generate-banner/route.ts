import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { generateBannerImage } from '@/lib/banner-generate'

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  let body: { title?: string; excerpt?: string; slug?: string }
  try {
    body = (await request.json()) as { title?: string; excerpt?: string; slug?: string }
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
  }

  const { title, excerpt, slug } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Titel fehlt — bitte zuerst einen Titel eingeben' }, { status: 400 })
  }

  try {
    const imageBuffer = await generateBannerImage(title.trim(), excerpt?.trim() ?? '')

    const rawSlug = (slug ?? '').replace(/[^a-z0-9_-]/gi, '-').slice(0, 100)
    const filename = `${rawSlug || Date.now()}-ai.png`

    const uploadDir = path.join(process.cwd(), 'public', 'images', 'journal')
    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, filename), imageBuffer)

    return NextResponse.json({ url: `/images/journal/${filename}` })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unbekannter Fehler'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
