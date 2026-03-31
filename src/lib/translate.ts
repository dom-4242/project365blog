import Anthropic, { APIError } from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface TranslationInput {
  title: string
  content: string // HTML
  excerpt?: string | null
}

export interface TranslationOutput {
  title: string
  content: string // HTML, tags preserved
  excerpt: string
}

const SYSTEM_PROMPT = `You are a professional German-to-English translator specializing in personal blog and diary entries.

Your task:
- Translate the JSON object you receive from German to English
- Preserve the authentic, first-person voice and personal tone
- The "content" field contains HTML — preserve ALL HTML tags exactly as-is, only translate the visible text between tags
- Keep numbers, dates, units (kg, km, etc.) and proper nouns unchanged
- Return ONLY a valid JSON object with keys "title", "content", and "excerpt" — no other text, no markdown, no code fences`

export async function translateEntryToEnglish(input: TranslationInput): Promise<TranslationOutput> {
  const payload = {
    title: input.title,
    content: input.content,
    excerpt: input.excerpt ?? '',
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: JSON.stringify(payload),
        },
      ],
    })

    const raw = message.content[0]
    if (raw.type !== 'text') throw new Error('Unexpected response type from Claude')

    // Strip possible markdown code fences in case the model adds them
    const jsonText = raw.text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

    const parsed = JSON.parse(jsonText) as TranslationOutput

    if (!parsed.title || !parsed.content) {
      throw new Error('Invalid translation response: missing required fields')
    }

    return {
      title: parsed.title,
      content: parsed.content,
      excerpt: parsed.excerpt || '',
    }
  } catch (e) {
    if (e instanceof APIError) {
      // Surface the Anthropic error message directly (e.g. "credit balance too low")
      throw new Error(e.message)
    }
    throw e
  }
}
