import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PhotoCategory } from '@prisma/client'
import { PRIVATE_PHOTO_DIR } from '@/lib/body-photos'

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
}

const MAX_SIZE_BYTES = 15 * 1024 * 1024 // 15 MB

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

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

  const ext = ALLOWED_TYPES[file.type]
  if (!ext) {
    return NextResponse.json({ error: 'Nur JPEG, PNG, WebP und HEIC werden unterstützt' }, { status: 422 })
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Datei darf maximal 15 MB gross sein' }, { status: 422 })
  }

  const rawDate = (formData.get('date') as string | null)?.trim() ?? new Date().toISOString().slice(0, 10)
  const rawCategory = (formData.get('category') as string | null)?.toUpperCase()
  const category: PhotoCategory = ['FRONT', 'SIDE', 'BACK'].includes(rawCategory ?? '')
    ? (rawCategory as PhotoCategory)
    : 'FRONT'
  const notes = (formData.get('notes') as string | null)?.trim() || null

  // Eindeutiger Dateiname — kein path traversal möglich
  const filename = `${crypto.randomUUID()}${ext}`

  await mkdir(PRIVATE_PHOTO_DIR, { recursive: true })
  const bytes = await file.arrayBuffer()
  await writeFile(path.join(PRIVATE_PHOTO_DIR, filename), Buffer.from(bytes))

  const photo = await prisma.bodyPhoto.create({
    data: { filename, date: new Date(rawDate), category, notes },
  })

  return NextResponse.json({ id: photo.id })
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { id } = (await request.json()) as { id: string }
  const photo = await prisma.bodyPhoto.findUnique({ where: { id } })
  if (!photo) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  // Datei löschen (Fehler ignorieren falls bereits weg)
  const { unlink } = await import('fs/promises')
  await unlink(path.join(PRIVATE_PHOTO_DIR, photo.filename)).catch(() => undefined)

  await prisma.bodyPhoto.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
