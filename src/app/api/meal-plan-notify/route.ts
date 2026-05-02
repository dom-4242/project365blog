import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { zurichDateStr } from '@/lib/timezone'

const SLOTS = ['breakfast', 'snackMorning', 'lunch', 'snackAfternoon', 'dinner', 'snack'] as const
type Slot = (typeof SLOTS)[number]

const SLOT_LABELS: Record<Slot, string> = {
  breakfast:      '🥣 Frühstück',
  snackMorning:   '🍎 Snack Vormittag',
  lunch:          '🍽️ Mittagessen',
  snackAfternoon: '🍌 Snack Nachmittag',
  dinner:         '🌙 Abendessen',
  snack:          '🥜 Bonus-Snack',
}

const SLOT_COLORS: Record<Slot, number> = {
  breakfast:      0xffa500,
  snackMorning:   0x22c55e,
  lunch:          0x3b82f6,
  snackAfternoon: 0xa855f7,
  dinner:         0xff7852,
  snack:          0xeab308,
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.MEAL_NOTIFY_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'MEAL_NOTIFY_API_KEY not configured' }, { status: 500 })

  const authHeader = request.headers.get('authorization')
  const providedKey = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : request.nextUrl.searchParams.get('token')

  if (providedKey !== apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slot = request.nextUrl.searchParams.get('slot') as Slot | null
  if (!slot || !SLOTS.includes(slot)) {
    return NextResponse.json({ error: 'Invalid slot' }, { status: 400 })
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return NextResponse.json({ error: 'DISCORD_WEBHOOK_URL not configured' }, { status: 500 })

  const todayStr = zurichDateStr()
  const date = new Date(`${todayStr}T00:00:00.000Z`)
  const plan = await prisma.mealPlan.findUnique({ where: { date } })

  const meal = plan?.[slot]
  const label = SLOT_LABELS[slot]
  const color = SLOT_COLORS[slot]

  const description = meal
    ? `**${meal}**`
    : '_Nichts geplant_'

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [
        {
          title: label,
          description,
          color,
          footer: { text: todayStr },
        },
      ],
    }),
  })

  return NextResponse.json({ ok: true, slot, date: todayStr, meal: meal ?? null })
}
