import { readFile } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PRIVATE_PHOTO_DIR } from '../route'

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireAdmin()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const photo = await prisma.bodyPhoto.findUnique({ where: { id: params.id } })
  if (!photo) return new NextResponse('Not found', { status: 404 })

  const ext = path.extname(photo.filename).toLowerCase()
  const contentType = MIME[ext] ?? 'application/octet-stream'

  let buffer: Buffer
  try {
    buffer = await readFile(path.join(PRIVATE_PHOTO_DIR, photo.filename))
  } catch {
    return new NextResponse('File not found', { status: 404 })
  }

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
