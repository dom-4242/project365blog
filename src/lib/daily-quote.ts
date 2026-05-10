import Anthropic, { APIError } from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface DailyQuoteContext {
  date: string // YYYY-MM-DD
  dayNumber?: number
  movement: string // German label
  nutrition: string
  smoking: string
  steps?: number | null
  weightKg?: number | null
  bodyFatPct?: number | null
  mealScore?: number | null
  movementStreak?: number
  smokingStreak?: number
  nutritionStreak?: number
}

const SYSTEM_PROMPT = `Du formulierst kurze, persönliche Tageszitate für ein deutschsprachiges Habit-Journal in der Ich-Form.

Stilregeln:
- Ein einzelner Satz, maximal 18 Wörter
- Persönlich und reflektiert, kein motivierendes Pathos, keine Klischees
- Beziehe dich auf konkrete Details des Tages (z. B. Schritte, Säulen, Streak), wenn vorhanden
- Keine Anführungszeichen, keine Emojis, kein Datum, kein Absender
- Antwort enthält ausschliesslich den Satz selbst, sonst nichts`

function buildUserMessage(ctx: DailyQuoteContext): string {
  const lines = [
    `Datum: ${ctx.date}${ctx.dayNumber ? ` (Tag ${ctx.dayNumber})` : ''}`,
    `Bewegung: ${ctx.movement}`,
    `Ernährung: ${ctx.nutrition}`,
    `Rauchstopp: ${ctx.smoking}`,
  ]
  if (ctx.steps != null) lines.push(`Schritte: ${ctx.steps.toLocaleString('de-CH')}`)
  if (ctx.weightKg != null) lines.push(`Gewicht: ${ctx.weightKg.toFixed(1)} kg`)
  if (ctx.bodyFatPct != null) lines.push(`Körperfett: ${ctx.bodyFatPct.toFixed(1)} %`)
  if (ctx.mealScore != null) lines.push(`Ernährungs-Score: ${ctx.mealScore.toFixed(1)} / 10`)
  if (ctx.movementStreak != null) lines.push(`Bewegungs-Streak: ${ctx.movementStreak} Tage`)
  if (ctx.smokingStreak != null) lines.push(`Rauchstopp-Streak: ${ctx.smokingStreak} Tage`)
  if (ctx.nutritionStreak != null) lines.push(`Ernährungs-Streak: ${ctx.nutritionStreak} Tage`)
  return lines.join('\n')
}

export async function generateDailyQuote(ctx: DailyQuoteContext): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY nicht konfiguriert')
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserMessage(ctx) }],
    })

    const block = message.content[0]
    if (!block || block.type !== 'text') {
      throw new Error('Unerwartete API-Antwort')
    }

    return block.text.trim().replace(/^["„»]+|["«"»]+$/g, '').trim()
  } catch (e) {
    if (e instanceof APIError) {
      throw new Error(`Claude API Fehler: ${e.message}`)
    }
    throw e
  }
}
