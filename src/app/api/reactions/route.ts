import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ReactionType } from '@prisma/client'

const VALID_EMOJIS = new Set<ReactionType>(['HEART', 'CLAP', 'FIRE', 'MUSCLE', 'STAR'])
const EMPTY_COUNTS: Record<ReactionType, number> = {
  HEART: 0,
  CLAP: 0,
  FIRE: 0,
  MUSCLE: 0,
  STAR: 0,
}

async function getReactionCounts(entryId: string): Promise<Record<ReactionType, number>> {
  const rows = await prisma.reaction.groupBy({
    by: ['emoji'],
    where: { entryId },
    _count: { emoji: true },
  })

  const counts = { ...EMPTY_COUNTS }
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

  const entry = await prisma.journalEntry.findUnique({ where: { slug }, select: { id: true } })
  if (!entry) {
    return NextResponse.json({ reactions: EMPTY_COUNTS })
  }

  const reactions = await getReactionCounts(entry.id)
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

  const entry = await prisma.journalEntry.findUnique({ where: { slug }, select: { id: true } })
  if (!entry) {
    return NextResponse.json({ error: 'entry not found' }, { status: 404 })
  }

  const ipHash = getIpHash(request)
  const reactionType = emoji as ReactionType

  const existing = await prisma.reaction.findUnique({
    where: { entryId_emoji_ipHash: { entryId: entry.id, emoji: reactionType, ipHash } },
  })

  let action: 'added' | 'removed'
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } })
    action = 'removed'
  } else {
    await prisma.reaction.create({ data: { entryId: entry.id, emoji: reactionType, ipHash } })
    action = 'added'
  }

  const reactions = await getReactionCounts(entry.id)
  return NextResponse.json({ action, reactions })
}
