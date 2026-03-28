import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Keine Datei übermittelt' }, { status: 400 })
  }

  // Dateityp prüfen
  const ext = ALLOWED_TYPES[file.type]
  if (!ext) {
    return NextResponse.json(
      { error: 'Nur JPEG, PNG und WebP werden unterstützt' },
      { status: 422 }
    )
  }

  // Dateigrösse prüfen
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Datei darf maximal 5 MB gross sein' }, { status: 422 })
  }

  // Dateiname aus Slug oder Timestamp
  const slug = (formData.get('slug') as string | null)?.trim()
  const filename = `${slug || Date.now()}${ext}`

  const uploadDir = path.join(process.cwd(), 'public', 'images', 'journal')
  await mkdir(uploadDir, { recursive: true })

  const bytes = await file.arrayBuffer()
  await writeFile(path.join(uploadDir, filename), Buffer.from(bytes))

  return NextResponse.json({ url: `/images/journal/${filename}` })
}
