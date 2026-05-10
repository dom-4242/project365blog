import Anthropic, { APIError } from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface TranslationInput {
  title?: string
  content?: string // HTML
  excerpt?: string | null
  dailyQuote?: string | null
}

export interface TranslationOutput {
  title?: string
  content?: string // HTML, tags preserved
  excerpt?: string
  dailyQuote?: string
}

const SYSTEM_PROMPT_EN = `You are a professional German-to-English translator specializing in personal blog and diary entries.

Your task:
- Translate the JSON object you receive from German to English
- Preserve the authentic, first-person voice and personal tone
- Translate ONLY the fields that are present in the input. Possible fields: "title", "content", "excerpt", "dailyQuote"
- The "content" field contains HTML — preserve ALL HTML tags exactly as-is, only translate the visible text between tags
- The "dailyQuote" field is a single short reflective sentence in first person — keep it short, natural, and ideally one sentence
- Keep numbers, dates, units (kg, km, etc.) and proper nouns unchanged
- Return ONLY a valid JSON object containing exactly the same keys as the input — no other text, no markdown, no code fences`

const SYSTEM_PROMPT_PT = `You are a professional German-to-Brazilian Portuguese translator specializing in personal blog and diary entries.

Your task:
- Translate the JSON object you receive from German to Brazilian Portuguese (pt-BR)
- Preserve the authentic, first-person voice and personal tone
- Translate ONLY the fields that are present in the input. Possible fields: "title", "content", "excerpt", "dailyQuote"
- The "content" field contains HTML — preserve ALL HTML tags exactly as-is, only translate the visible text between tags
- The "dailyQuote" field is a single short reflective sentence in first person — keep it short, natural, and ideally one sentence
- Keep numbers, dates, units (kg, km, etc.) and proper nouns unchanged
- Use Brazilian Portuguese (Brazil) conventions, not European Portuguese
- Return ONLY a valid JSON object containing exactly the same keys as the input — no other text, no markdown, no code fences`

function buildPayload(input: TranslationInput): Record<string, string> {
  const payload: Record<string, string> = {}
  if (input.title) payload.title = input.title
  if (input.content) payload.content = input.content
  if (input.excerpt) payload.excerpt = input.excerpt
  if (input.dailyQuote) payload.dailyQuote = input.dailyQuote
  return payload
}

async function callClaude(systemPrompt: string, input: TranslationInput): Promise<TranslationOutput> {
  const payload = buildPayload(input)
  if (Object.keys(payload).length === 0) return {}

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: JSON.stringify(payload) }],
    })

    const raw = message.content[0]
    if (raw.type !== 'text') throw new Error('Unexpected response type from Claude')

    const jsonText = raw.text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(jsonText) as TranslationOutput

    return {
      title: parsed.title,
      content: parsed.content,
      excerpt: parsed.excerpt,
      dailyQuote: parsed.dailyQuote,
    }
  } catch (e) {
    if (e instanceof APIError) throw new Error(e.message)
    throw e
  }
}

/** Translate a journal entry (or just its quote, for fillers) to the given locale. */
export async function translateEntry(
  input: TranslationInput,
  locale: 'en' | 'pt',
): Promise<TranslationOutput> {
  return callClaude(locale === 'pt' ? SYSTEM_PROMPT_PT : SYSTEM_PROMPT_EN, input)
}
