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

// =============================================================================
// Nährwerttabelle → AI-Anreicherung eines FoodItems (Punkt 4)
//
// Liest eine Verpackung/Nährwerttabelle und liefert die Werte JE 100 g/ml inkl.
// des fokussierten 12er-Mikro-Satzes als strukturiertes JSON. Der Owner prüft
// die Werte anschliessend im Katalog-Formular, bevor gespeichert wird.
// =============================================================================

export interface LabelNutrients {
  name: string | null
  brand: string | null
  baseUnit: 'g' | 'ml'
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number | null
  sugarG: number | null
  saturatedFatG: number | null
  sodiumMg: number | null
  potassiumMg: number | null
  ironMg: number | null
  magnesiumMg: number | null
  calciumMg: number | null
  zincMg: number | null
  vitaminDUg: number | null
  vitaminB12Ug: number | null
  vitaminCMg: number | null
  confidence: number
  note: string
  raw: unknown
}

const LABEL_SYSTEM_PROMPT = `Du liest eine Nährwerttabelle bzw. Produktverpackung und gibst die Nährwerte JE 100 g (feste Lebensmittel) bzw. JE 100 ml (Getränke) zurück.

Regeln:
- Werte IMMER pro 100 g/ml, nicht pro Portion. Zeigt die Tabelle nur "pro Portion", rechne mit der angegebenen Portionsgrösse auf 100 um.
- baseUnit: "g" für feste, "ml" für flüssige Produkte.
- Ist nur Salz angegeben, rechne Natrium = Salz(g) / 2,5 und gib es in mg an.
- Einheiten: g für Makros/Ballaststoffe/Zucker/gesättigte Fettsäuren; mg für Natrium/Kalium/Eisen/Magnesium/Calcium/Zink/Vitamin C; µg für Vitamin D/B12.
- Fülle nur klar ablesbare Werte. Nicht vorhandene Mikros = null (nicht raten).
- Produktname/Marke von der Verpackung, wenn erkennbar, sonst null.
- Ehrliche Konfidenz (0.0–1.0).
- Antworte AUSSCHLIESSLICH mit einem einzigen minifizierten JSON-Objekt, ohne Markdown, ohne Erklärtext.

JSON-Schema:
{"name": string|null, "brand": string|null, "baseUnit": "g"|"ml", "kcal": number, "proteinG": number, "carbsG": number, "fatG": number, "fiberG": number|null, "sugarG": number|null, "saturatedFatG": number|null, "sodiumMg": number|null, "potassiumMg": number|null, "ironMg": number|null, "magnesiumMg": number|null, "calciumMg": number|null, "zincMg": number|null, "vitaminDUg": number|null, "vitaminB12Ug": number|null, "vitaminCMg": number|null, "confidence": number, "note": string}`

function numOrNull(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  if (isNaN(n)) return null
  return Math.max(0, Math.round(n * 100) / 100)
}

function strOrNull(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

/** Robustes Parsen der Label-Antwort (erstes {...}-Objekt). */
export function parseLabelNutrients(text: string): LabelNutrients {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Keine JSON-Antwort vom Modell erhalten')
  }
  const raw = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
  return {
    name: strOrNull(raw.name),
    brand: strOrNull(raw.brand),
    baseUnit: raw.baseUnit === 'ml' ? 'ml' : 'g',
    kcal: num(raw.kcal),
    proteinG: num(raw.proteinG),
    carbsG: num(raw.carbsG),
    fatG: num(raw.fatG),
    fiberG: numOrNull(raw.fiberG),
    sugarG: numOrNull(raw.sugarG),
    saturatedFatG: numOrNull(raw.saturatedFatG),
    sodiumMg: numOrNull(raw.sodiumMg),
    potassiumMg: numOrNull(raw.potassiumMg),
    ironMg: numOrNull(raw.ironMg),
    magnesiumMg: numOrNull(raw.magnesiumMg),
    calciumMg: numOrNull(raw.calciumMg),
    zincMg: numOrNull(raw.zincMg),
    vitaminDUg: numOrNull(raw.vitaminDUg),
    vitaminB12Ug: numOrNull(raw.vitaminB12Ug),
    vitaminCMg: numOrNull(raw.vitaminCMg),
    confidence: clamp01(raw.confidence),
    note: typeof raw.note === 'string' ? raw.note.trim() : '',
    raw,
  }
}

export async function extractLabelNutrients(label: VisionImage): Promise<LabelNutrients> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY nicht konfiguriert')
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const content: Anthropic.MessageParam['content'] = [
    { type: 'text', text: 'Foto der Nährwerttabelle / Produktverpackung:' },
    { type: 'image', source: { type: 'base64', media_type: label.mediaType, data: label.data } },
    { type: 'text', text: 'Antworte nur mit dem JSON-Objekt.' },
  ]

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: LABEL_SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    })
    const block = message.content[0]
    if (!block || block.type !== 'text') throw new Error('Unerwartete API-Antwort')
    return parseLabelNutrients(block.text)
  } catch (e) {
    if (e instanceof APIError) throw new Error(`Claude API Fehler: ${e.message}`)
    throw e
  }
}
