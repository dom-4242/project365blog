import Anthropic, { APIError } from '@anthropic-ai/sdk'
import { prisma } from './db'
import { MovementLevel, NutritionLevel, SmokingStatus } from '@prisma/client'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// =============================================
// Types
// =============================================

export interface MonthSummaryData {
  id: string
  year: number
  month: number
  contentDe: string
  contentEn: string | null
  generatedAt: Date
  updatedAt: Date
}

// =============================================
// DB Queries
// =============================================

export async function getMonthSummary(year: number, month: number): Promise<MonthSummaryData | null> {
  return prisma.monthSummary.findUnique({ where: { year_month: { year, month } } })
}

export async function getAllMonthSummaries(): Promise<MonthSummaryData[]> {
  return prisma.monthSummary.findMany({ orderBy: [{ year: 'desc' }, { month: 'desc' }] })
}

// =============================================
// Stats helpers
// =============================================

function habitRate(values: string[], match: string[]): string {
  const count = values.filter((v) => match.includes(v)).length
  return values.length === 0 ? '—' : `${Math.round((count / values.length) * 100)} %`
}

function avg(nums: (number | null)[]): number | null {
  const valid = nums.filter((n): n is number => n !== null)
  return valid.length === 0 ? null : valid.reduce((a, b) => a + b, 0) / valid.length
}

function fmt(n: number | null, decimals = 1, unit = ''): string {
  if (n === null) return '—'
  return `${n.toFixed(decimals)}${unit}`
}

// =============================================
// Generate summary via Claude API
// =============================================

const SYSTEM_PROMPT = `Du bist ein einfühlsamer persönlicher Assistent, der monatliche Rückblicke für ein öffentliches Tagebuch-Projekt schreibt.

"Project 365" ist ein öffentliches 365-Tage-Tagebuch. Der Autor dokumentiert täglich seine drei Gewohnheits-Säulen:
- Bewegung: MINIMAL | STEPS_ONLY (10'000+ Schritte) | STEPS_TRAINED (10'000+ Schritte + Training)
- Ernährung: NONE | ONE | TWO | THREE (gesunde Mahlzeiten pro Tag)
- Rauchstopp: SMOKED | REPLACEMENT (Nikotinersatz) | NONE (rauchfrei)

Schreibe einen motivierenden, ehrlichen Monatsrückblick in der Du-Form. Tone: warm, persönlich, ehrlich — kein klinisches Dashboard.

Strukturiere den Text als HTML mit diesen Abschnitten (verwende <h2> für Überschriften):
1. Highlights & Meilensteine
2. Die drei Säulen (mit konkreten Zahlen)
3. Metriken im Überblick (nur wenn Daten vorhanden, sonst weglassen)
4. Persönliche Reflexion & Ausblick

Regeln:
- Nur HTML-Body-Content (kein <!DOCTYPE>, kein <html>/<body>)
- Verwende <p>, <h2>, <ul>, <li>, <strong> — kein Markdown
- Sprich den Autor direkt mit "Du" an
- Sei konkret mit den Zahlen aus den Daten
- Sei motivierend aber realistisch — auch schlechte Monate verdienen ehrliche Worte`

interface EntryContext {
  date: string
  title: string
  excerpt: string
  movement: MovementLevel
  nutrition: NutritionLevel
  smoking: SmokingStatus
}

interface MetricsContext {
  avgWeight: number | null
  avgSteps: number | null
  avgSleepH: number | null
  avgRestingHR: number | null
}

interface SummaryContext {
  year: number
  month: number
  monthName: string
  entryCount: number
  entries: EntryContext[]
  habitStats: {
    movementGood: string
    nutritionGood: string
    smokingClean: string
    smokingSmoked: string
  }
  metrics: MetricsContext
}

function buildPrompt(ctx: SummaryContext): string {
  const entriesText = ctx.entries
    .map((e) => `- ${e.date} "${e.title}" | Bewegung: ${e.movement} | Ernährung: ${e.nutrition} | Rauchen: ${e.smoking}${e.excerpt ? ` | "${e.excerpt}"` : ''}`)
    .join('\n')

  return `Monat: ${ctx.monthName} ${ctx.year}
Einträge: ${ctx.entryCount} von ~${new Date(ctx.year, ctx.month, 0).getDate()} Tagen

HABITS-STATISTIK:
- Bewegung gut (STEPS_ONLY oder STEPS_TRAINED): ${ctx.habitStats.movementGood}
- Ernährung gut (mind. 2 Mahlzeiten): ${ctx.habitStats.nutritionGood}
- Rauchfrei (NONE): ${ctx.habitStats.smokingClean}
- Geraucht (SMOKED): ${ctx.habitStats.smokingSmoked}

METRIKEN (Monatsdurchschnitt):
- Gewicht: ${fmt(ctx.metrics.avgWeight, 1, ' kg')}
- Schritte: ${ctx.metrics.avgSteps !== null ? Math.round(ctx.metrics.avgSteps).toLocaleString('de-CH') : '—'}
- Schlaf: ${ctx.metrics.avgSleepH !== null ? fmt(ctx.metrics.avgSleepH, 1, ' h') : '—'}
- Ruheherzfrequenz: ${ctx.metrics.avgRestingHR !== null ? Math.round(ctx.metrics.avgRestingHR) + ' bpm' : '—'}

EINTRÄGE DES MONATS:
${entriesText}

Bitte schreibe den Monatsrückblick auf Deutsch.`
}

async function translateSummaryToEnglish(deSummary: string): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: `You are a professional German-to-English translator specializing in personal blog content.
Translate the HTML content from German to English.
Preserve ALL HTML tags exactly. Only translate the visible text.
Keep "Du" → "you" (informal, direct address).
Return ONLY the translated HTML — no extra text, no code fences.`,
    messages: [{ role: 'user', content: deSummary }],
  })

  const raw = message.content[0]
  if (raw.type !== 'text') throw new Error('Unexpected Claude response type')
  return raw.text.trim()
}

export async function generateAndSaveMonthSummary(year: number, month: number): Promise<MonthSummaryData> {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59)

  const [entries, metricsRows] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { date: { gte: start, lte: end }, published: true },
      orderBy: { date: 'asc' },
      select: { date: true, title: true, excerpt: true, movement: true, nutrition: true, smoking: true },
    }),
    prisma.dailyMetrics.findMany({
      where: { date: { gte: start, lte: end } },
      select: { weight: true, steps: true, sleepDuration: true, restingHR: true },
    }),
  ])

  const movements = entries.map((e) => e.movement)
  const nutritions = entries.map((e) => e.nutrition)
  const smokings = entries.map((e) => e.smoking)

  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

  const ctx: SummaryContext = {
    year,
    month,
    monthName: monthNames[month - 1],
    entryCount: entries.length,
    entries: entries.map((e) => ({
      date: e.date.toISOString().slice(0, 10),
      title: e.title,
      excerpt: e.excerpt ?? '',
      movement: e.movement,
      nutrition: e.nutrition,
      smoking: e.smoking,
    })),
    habitStats: {
      movementGood: habitRate(movements, [MovementLevel.STEPS_ONLY, MovementLevel.STEPS_TRAINED]),
      nutritionGood: habitRate(nutritions, [NutritionLevel.TWO, NutritionLevel.THREE]),
      smokingClean: habitRate(smokings, [SmokingStatus.NONE]),
      smokingSmoked: habitRate(smokings, [SmokingStatus.SMOKED]),
    },
    metrics: {
      avgWeight: avg(metricsRows.map((m) => m.weight)),
      avgSteps: avg(metricsRows.map((m) => m.steps)),
      avgSleepH: avg(metricsRows.map((m) => (m.sleepDuration !== null ? m.sleepDuration / 60 : null))),
      avgRestingHR: avg(metricsRows.map((m) => m.restingHR)),
    },
  }

  try {
    const deMessage = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildPrompt(ctx) }],
    })

    const raw = deMessage.content[0]
    if (raw.type !== 'text') throw new Error('Unexpected Claude response type')
    const contentDe = raw.text.trim()

    const contentEn = await translateSummaryToEnglish(contentDe)

    const saved = await prisma.monthSummary.upsert({
      where: { year_month: { year, month } },
      create: { year, month, contentDe, contentEn, generatedAt: new Date() },
      update: { contentDe, contentEn, generatedAt: new Date() },
    })

    return saved
  } catch (e) {
    if (e instanceof APIError) throw new Error(e.message)
    throw e
  }
}
