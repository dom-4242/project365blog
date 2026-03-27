import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ReactionType } from '@prisma/client'

const VALID_EMOJIS = new Set<ReactionType>(['HEART', 'CLAP', 'FIRE', 'MUSCLE', 'STAR'])

async function getReactionCounts(slug: string): Promise<Record<ReactionType, number>> {
  const rows = await prisma.reaction.groupBy({
    by: ['emoji'],
    where: { slug },
    _count: { emoji: true },
  })

  const counts = { HEART: 0, CLAP: 0, FIRE: 0, MUSCLE: 0, STAR: 0 } as Record<ReactionType, number>
  for (const row of rows) {
    counts[row.emoji] = row._count.emoji
  }
  return counts
}

function getIpHash(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return createHash('sha256').update(ip).digest('hex')
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')
  if (!slug) {
    return NextResponse.json({ error: 'slug required' }, { status: 400 })
  }

  const reactions = await getReactionCounts(slug)
  return NextResponse.json({ reactions })
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  const { slug, emoji } = body as { slug?: string; emoji?: string }

  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ error: 'slug required' }, { status: 400 })
  }
  if (!emoji || !VALID_EMOJIS.has(emoji as ReactionType)) {
    return NextResponse.json({ error: 'invalid emoji' }, { status: 400 })
  }

  const ipHash = getIpHash(request)
  const reactionType = emoji as ReactionType

  const existing = await prisma.reaction.findUnique({
    where: { slug_emoji_ipHash: { slug, emoji: reactionType, ipHash } },
  })

  let action: 'added' | 'removed'
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } })
    action = 'removed'
  } else {
    await prisma.reaction.create({ data: { slug, emoji: reactionType, ipHash } })
    action = 'added'
  }

  const reactions = await getReactionCounts(slug)
  return NextResponse.json({ action, reactions })
}
