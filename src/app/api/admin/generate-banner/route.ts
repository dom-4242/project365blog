import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import {
  generateBannerImage,
  generateBannerFromMetrics,
  type MetricsBannerContext,
} from '@/lib/banner-generate'
import { prisma } from '@/lib/db'
import { getDayNumber } from '@/lib/journal'
import { getProjectStartDate } from '@/lib/project-config'

interface TextRequest {
  mode?: 'text'
  title?: string
  excerpt?: string
  slug?: string
}

interface MetricsRequest {
  mode: 'metrics'
  slug?: string
  date: string // YYYY-MM-DD
  movement: MetricsBannerContext['movement']
  nutrition: MetricsBannerContext['nutrition']
  smoking: MetricsBannerContext['smoking']
}

type RequestBody = TextRequest | MetricsRequest

function isMetrics(body: RequestBody): body is MetricsRequest {
  return body.mode === 'metrics'
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
  }

  try {
    let imageBuffer: Buffer

    if (isMetrics(body)) {
      if (!body.date) {
        return NextResponse.json({ error: 'Datum fehlt' }, { status: 400 })
      }
      const date = new Date(body.date)
      const [metrics, mealLog, startDate] = await Promise.all([
        prisma.dailyMetrics.findUnique({ where: { date }, select: { steps: true } }),
        prisma.mealLog.findUnique({ where: { date }, select: { score: true } }),
        getProjectStartDate(),
      ])

      imageBuffer = await generateBannerFromMetrics({
        dayNumber: getDayNumber(body.date, startDate),
        movement: body.movement,
        nutrition: body.nutrition,
        smoking: body.smoking,
        steps: metrics?.steps,
        mealScore: mealLog?.score,
      })
    } else {
      if (!body.title?.trim()) {
        return NextResponse.json({ error: 'Titel fehlt — bitte zuerst einen Titel eingeben' }, { status: 400 })
      }
      imageBuffer = await generateBannerImage(body.title.trim(), body.excerpt?.trim() ?? '')
    }

    const rawSlug = (body.slug ?? '').replace(/[^a-z0-9_-]/gi, '-').slice(0, 100)
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
