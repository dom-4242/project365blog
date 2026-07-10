// =============================================================================
// Foto → AI-Nährwertschätzung (Nutrition-Umbau, N-06)
//
// Nutzt die bestehende @anthropic-ai/sdk-Anbindung (Claude mit Vision). Bis zu
// zwei Bilder (Teller + Speisekarte) plus optionaler Gerichtstitel → geschätzte
// Nährwerte der GESAMTEN abgebildeten Portion als strukturiertes JSON. Der
// Nutzer bestätigt/korrigiert anschliessend (N-06-UX), bevor geloggt wird.
// Keys bleiben serverseitig (nur aus Route Handlers aufrufen).
// =============================================================================

import Anthropic, { APIError } from '@anthropic-ai/sdk'

// Muss ein Vision-fähiges Modell sein (wie im übrigen Projekt genutzt).
const MODEL = 'claude-sonnet-4-6'

export type VisionMediaType = 'image/jpeg' | 'image/png' | 'image/webp'

export interface VisionImage {
  data: string // base64 (ohne data:-Präfix)
  mediaType: VisionMediaType
}

export interface AiEstimate {
  dishName: string
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  confidence: number // 0..1
  note: string
  raw: unknown // rohes Modell-JSON → MealPhoto.aiAnalysis
}

const SYSTEM_PROMPT = `Du bist Ernährungswissenschaftler und schätzt die Nährwerte einer Mahlzeit anhand von Fotos.

Regeln:
- Schätze die Werte für die GESAMTE abgebildete Portion (so, wie sie serviert wird), nicht pro 100 g.
- Nutze das Speisekarten-Foto und/oder den Gerichtstitel als Hinweise, wenn vorhanden.
- Gib eine ehrliche Konfidenz (0.0–1.0). Bei Unsicherheit trotzdem die beste Schätzung, aber niedrigere Konfidenz.
- Antworte AUSSCHLIESSLICH mit einem einzigen minifizierten JSON-Objekt, ohne Markdown, ohne Erklärtext.

JSON-Schema:
{"dishName": string (deutsch), "kcal": number, "proteinG": number, "carbsG": number, "fatG": number, "confidence": number (0..1), "note": string (kurz, deutsch, Annahmen)}`

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return isNaN(n) ? 0 : Math.max(0, Math.round(n * 10) / 10)
}

function clamp01(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  if (isNaN(n)) return 0.5
  return Math.min(1, Math.max(0, n))
}

/** Robustes Parsen: erstes {...}-Objekt aus der Antwort extrahieren. */
export function parseEstimate(text: string): AiEstimate {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Keine JSON-Antwort vom Modell erhalten')
  }
  const raw = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
  return {
    dishName: typeof raw.dishName === 'string' && raw.dishName.trim() ? raw.dishName.trim() : 'Geschätzte Mahlzeit',
    kcal: num(raw.kcal),
    proteinG: num(raw.proteinG),
    carbsG: num(raw.carbsG),
    fatG: num(raw.fatG),
    confidence: clamp01(raw.confidence),
    note: typeof raw.note === 'string' ? raw.note.trim() : '',
    raw,
  }
}

export interface EstimateArgs {
  plate: VisionImage
  menu?: VisionImage | null
  title?: string | null
}

export async function estimateFromPhotos({ plate, menu, title }: EstimateArgs): Promise<AiEstimate> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY nicht konfiguriert')
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const content: Anthropic.MessageParam['content'] = [
    { type: 'text', text: 'Teller-Foto der Mahlzeit:' },
    { type: 'image', source: { type: 'base64', media_type: plate.mediaType, data: plate.data } },
  ]
  if (menu) {
    content.push({ type: 'text', text: 'Speisekarten-Foto (Kontext):' })
    content.push({ type: 'image', source: { type: 'base64', media_type: menu.mediaType, data: menu.data } })
  }
  if (title && title.trim()) {
    content.push({ type: 'text', text: `Gerichtstitel: ${title.trim()}` })
  }
  content.push({ type: 'text', text: 'Antworte nur mit dem JSON-Objekt.' })

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    })
    const block = message.content[0]
    if (!block || block.type !== 'text') throw new Error('Unerwartete API-Antwort')
    return parseEstimate(block.text)
  } catch (e) {
    if (e instanceof APIError) throw new Error(`Claude API Fehler: ${e.message}`)
    throw e
  }
}
