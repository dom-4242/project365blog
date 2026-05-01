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
  contentPt: string | null
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

export async function getLatestMonthSummary(): Promise<MonthSummaryData | null> {
  return prisma.monthSummary.findFirst({ orderBy: [{ year: 'desc' }, { month: 'desc' }] })
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
- Bewegung: MINIMAL | STEPS_ONLY (10'000+ Schritte) | TRAINED_ONLY (Training, unter 10k) | STEPS_TRAINED (10'000+ Schritte + Training)
- Ernährung: NONE | ONE_MEAL | TWO_MEALS | THREE_MEALS (gesunde Mahlzeiten pro Tag); ergänzt durch einen Ernährungs-Score (0–10), bei dem 5 Mahlzeiten des Tages (Frühstück, Zmorgenschnäcke, Mittagessen, Nachmittagssnack, Abendessen) je auf einer Skala von 1–10 bewertet werden. Score ≥ 8.0 gilt als Ziel erfüllt.
- Rauchstopp: SMOKED | NICOTINE_REPLACEMENT (Nikotinersatz) | SMOKE_FREE (rauchfrei)

Schreibe den Monatsrückblick in der Ich-Form — als ob der Autor selbst über seinen Monat schreibt. Tone: warm, persönlich, ehrlich, reflektiert — kein klinisches Dashboard, kein Coaching-Ton.

Strukturiere den Text als HTML mit diesen Abschnitten (verwende <h2> für Überschriften):
1. Highlights & Meilensteine
2. Die drei Säulen (mit konkreten Zahlen)
3. Metriken im Überblick (nur wenn Daten vorhanden, sonst weglassen)
4. Persönliche Reflexion & Ausblick

Regeln:
- Nur HTML-Body-Content (kein <!DOCTYPE>, kein <html>/<body>)
- Verwende <p>, <h2>, <ul>, <li>, <strong> — kein Markdown
- Schreibe konsequent in der Ich-Form ("Ich habe…", "Mir ist aufgefallen…", "Ich bin stolz auf…")
- Sei konkret mit den Zahlen aus den Daten
- Sei ehrlich und reflektiert — auch schwierige Monate verdienen aufrichtige Worte`

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
  avgBodyFat: number | null
  avgSteps: number | null
}

interface DrinksContext {
  avgWaterMl: number | null
  avgColaZeroMl: number | null
}

interface SweetsContext {
  daysConsumed: number
  daysClean: number
  totalDays: number
}

interface BooksContext {
  pagesRead: number
  booksCompleted: { title: string; author: string | null }[]
  booksInProgress: { title: string; author: string | null; pagesRead: number }[]
}

interface MealScoreContext {
  daysLogged: number
  avgScore: number | null     // 0–10
  daysFullfilled: number      // score ≥ 8.0
  bestScore: number | null
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
  drinks: DrinksContext
  sweets: SweetsContext
  books: BooksContext
  mealScore: MealScoreContext
}

function buildPrompt(ctx: SummaryContext): string {
  const entriesText = ctx.entries
    .map((e) => `- ${e.date} "${e.title}" | Bewegung: ${e.movement} | Ernährung: ${e.nutrition} | Rauchen: ${e.smoking}${e.excerpt ? ` | "${e.excerpt}"` : ''}`)
    .join('\n')

  const booksCompletedText = ctx.books.booksCompleted.length > 0
    ? ctx.books.booksCompleted.map((b) => `"${b.title}"${b.author ? ` von ${b.author}` : ''}`).join(', ')
    : '—'
  const booksInProgressText = ctx.books.booksInProgress.length > 0
    ? ctx.books.booksInProgress.map((b) => `"${b.title}"${b.author ? ` von ${b.author}` : ''} (${b.pagesRead} Seiten gelesen)`).join(', ')
    : '—'

  return `Monat: ${ctx.monthName} ${ctx.year}
Einträge: ${ctx.entryCount} von ~${new Date(ctx.year, ctx.month, 0).getDate()} Tagen

HABITS-STATISTIK (die drei Säulen):
- Bewegung gut (STEPS_ONLY, TRAINED_ONLY oder STEPS_TRAINED): ${ctx.habitStats.movementGood}
- Ernährung gut (mind. 2 Mahlzeiten): ${ctx.habitStats.nutritionGood}
- Nicht geraucht (NICOTINE_REPLACEMENT oder SMOKE_FREE): ${ctx.habitStats.smokingClean}
- Geraucht (SMOKED): ${ctx.habitStats.smokingSmoked}

METRIKEN (Monatsdurchschnitt):
- Gewicht: ${fmt(ctx.metrics.avgWeight, 1, ' kg')}
- Körperfett: ${fmt(ctx.metrics.avgBodyFat, 1, ' %')}
- Schritte: ${ctx.metrics.avgSteps !== null ? Math.round(ctx.metrics.avgSteps).toLocaleString('de-CH') : '—'}

KONSUM:
- Wasser (Ø/Tag): ${ctx.drinks.avgWaterMl !== null ? Math.round(ctx.drinks.avgWaterMl) + ' ml' : '—'}
- Cola Zero (Ø/Tag): ${ctx.drinks.avgColaZeroMl !== null ? Math.round(ctx.drinks.avgColaZeroMl) + ' ml' : '—'}
- Süssigkeiten: ${ctx.sweets.totalDays > 0 ? `${ctx.sweets.daysConsumed} von ${ctx.sweets.totalDays} Tagen mit Süssigkeiten (${ctx.sweets.daysClean} Tage clean)` : '—'}

ERNÄHRUNGS-SCORE (Mahlzeiten-Bewertung, Skala 0–10):
- Tage mit erfasstem Score: ${ctx.mealScore.daysLogged > 0 ? ctx.mealScore.daysLogged : '—'}
- Durchschnittlicher Score: ${ctx.mealScore.avgScore !== null ? ctx.mealScore.avgScore.toFixed(1) + ' / 10' : '—'}
- Tage mit erfülltem Ernährungs-Ziel (Score ≥ 8.0): ${ctx.mealScore.daysLogged > 0 ? ctx.mealScore.daysFullfilled : '—'}
- Bester Tages-Score: ${ctx.mealScore.bestScore !== null ? ctx.mealScore.bestScore.toFixed(1) + ' / 10' : '—'}

LESEN:
- Seiten gelesen: ${ctx.books.pagesRead > 0 ? ctx.books.pagesRead : '—'}
- Bücher abgeschlossen: ${booksCompletedText}
- Bücher in Arbeit: ${booksInProgressText}

EINTRÄGE DES MONATS:
${entriesText}

Bitte schreibe den Monatsrückblick auf Deutsch, in der Ich-Form.`
}

async function translateSummary(deSummary: string, targetLang: 'en' | 'pt'): Promise<string> {
  const langConfig = {
    en: {
      system: `You are a professional German-to-English translator specializing in personal blog content.
Translate the HTML content from German to English.
Preserve ALL HTML tags exactly. Only translate the visible text.
The text is written in first person (Ich-Form) — keep it in first person ("I have…", "I noticed…").
Return ONLY the translated HTML — no extra text, no code fences.`,
    },
    pt: {
      system: `You are a professional German-to-Portuguese (Brazilian) translator specializing in personal blog content.
Translate the HTML content from German to Portuguese.
Preserve ALL HTML tags exactly. Only translate the visible text.
The text is written in first person (Ich-Form) — keep it in first person ("Eu fiz…", "Percebi que…").
Return ONLY the translated HTML — no extra text, no code fences.`,
    },
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: langConfig[targetLang].system,
    messages: [{ role: 'user', content: deSummary }],
  })

  const raw = message.content[0]
  if (raw.type !== 'text') throw new Error('Unexpected Claude response type')
  return raw.text.trim()
}

export async function generateAndSaveMonthSummary(year: number, month: number): Promise<MonthSummaryData> {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59)

  const drinkStart = new Date(year, month - 1, 1)
  const drinkEnd = new Date(year, month, 1)

  const [entries, metricsRows, drinkRows, sweetsRows, readingRows, mealLogRows] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { date: { gte: start, lte: end }, published: true },
      orderBy: { date: 'asc' },
      select: { date: true, title: true, excerpt: true, movement: true, nutrition: true, smoking: true },
    }),
    prisma.dailyMetrics.findMany({
      where: { date: { gte: start, lte: end } },
      select: { weight: true, bodyFat: true, steps: true },
    }),
    prisma.drinkLog.findMany({
      where: { timestamp: { gte: drinkStart, lt: drinkEnd } },
      select: { type: true, volume: true, timestamp: true },
    }),
    prisma.sweetsLog.findMany({
      where: { date: { gte: start, lte: end } },
      select: { consumed: true },
    }),
    prisma.readingLog.findMany({
      where: { date: { gte: start, lte: end } },
      select: { pagesRead: true, book: { select: { id: true, title: true, author: true, completed: true, endDate: true } } },
    }),
    prisma.mealLog.findMany({
      where: { date: { gte: start, lte: end } },
      select: { score: true },
    }),
  ])

  const movements = entries.map((e) => e.movement)
  const nutritions = entries.map((e) => e.nutrition)
  const smokings = entries.map((e) => e.smoking)

  // Drinks: group by day to compute daily averages
  const drinkDays = new Map<string, { water: number; cola: number }>()
  for (const d of drinkRows) {
    const day = d.timestamp.toISOString().slice(0, 10)
    const entry = drinkDays.get(day) ?? { water: 0, cola: 0 }
    if (d.type === 'WATER') entry.water += d.volume
    else entry.cola += d.volume
    drinkDays.set(day, entry)
  }
  const drinkDayValues = Array.from(drinkDays.values())

  // Books: aggregate pages per book, find completed books
  const bookPages = new Map<string, { title: string; author: string | null; pages: number; completed: boolean; endDate: Date | null }>()
  for (const r of readingRows) {
    const b = r.book
    const entry = bookPages.get(b.id) ?? { title: b.title, author: b.author, pages: 0, completed: b.completed, endDate: b.endDate }
    entry.pages += r.pagesRead
    bookPages.set(b.id, entry)
  }
  const bookList = Array.from(bookPages.values())
  const booksCompleted = bookList
    .filter((b) => b.completed && b.endDate && b.endDate >= start && b.endDate <= end)
    .map((b) => ({ title: b.title, author: b.author }))
  const booksInProgress = bookList
    .filter((b) => !booksCompleted.some((c) => c.title === b.title))
    .map((b) => ({ title: b.title, author: b.author, pagesRead: b.pages }))

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
      movementGood: habitRate(movements, [MovementLevel.STEPS_ONLY, MovementLevel.TRAINED_ONLY, MovementLevel.STEPS_TRAINED]),
      nutritionGood: habitRate(nutritions, [NutritionLevel.TWO_MEALS, NutritionLevel.THREE_MEALS]),
      smokingClean: habitRate(smokings, [SmokingStatus.NICOTINE_REPLACEMENT, SmokingStatus.SMOKE_FREE]),
      smokingSmoked: habitRate(smokings, [SmokingStatus.SMOKED]),
    },
    metrics: {
      avgWeight: avg(metricsRows.map((m) => m.weight)),
      avgBodyFat: avg(metricsRows.map((m) => m.bodyFat)),
      avgSteps: avg(metricsRows.map((m) => m.steps)),
    },
    drinks: {
      avgWaterMl: drinkDayValues.length > 0 ? avg(drinkDayValues.map((d) => d.water)) : null,
      avgColaZeroMl: drinkDayValues.length > 0 ? avg(drinkDayValues.map((d) => d.cola)) : null,
    },
    sweets: {
      daysConsumed: sweetsRows.filter((s) => s.consumed).length,
      daysClean: sweetsRows.filter((s) => !s.consumed).length,
      totalDays: sweetsRows.length,
    },
    books: {
      pagesRead: bookList.reduce((sum, b) => sum + b.pages, 0),
      booksCompleted,
      booksInProgress,
    },
    mealScore: (() => {
      const scores = mealLogRows.map((r) => r.score).filter((s): s is number => s !== null)
      return {
        daysLogged: scores.length,
        avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
        daysFullfilled: scores.filter((s) => s >= 8.0).length,
        bestScore: scores.length > 0 ? Math.max(...scores) : null,
      }
    })(),
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

    const [contentEn, contentPt] = await Promise.all([
      translateSummary(contentDe, 'en'),
      translateSummary(contentDe, 'pt'),
    ])

    const saved = await prisma.monthSummary.upsert({
      where: { year_month: { year, month } },
      create: { year, month, contentDe, contentEn, contentPt, generatedAt: new Date() },
      update: { contentDe, contentEn, contentPt, generatedAt: new Date() },
    })

    return saved
  } catch (e) {
    if (e instanceof APIError) throw new Error(e.message)
    throw e
  }
}
