import Anthropic, { APIError } from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a creative SVG designer specializing in abstract, minimalist banner artwork for a personal journal website.

Your task: Generate a beautiful abstract SVG banner (1200×420px viewBox) based on the given journal entry.

STYLE RULES (follow strictly for visual consistency across all banners):
- Abstract geometric composition: overlapping circles, ellipses, flowing curves, soft polygons
- Catppuccin Mocha color palette only:
  Background: #1e1e2e
  Accent colors: #cba6f7 (mauve), #89b4fa (blue), #a6e3a1 (green), #f38ba8 (red), #fab387 (peach), #f9e2af (yellow), #94e2d5 (teal), #89dceb (sky)
  Surface colors: #313244, #45475a, #585b70
- Use 4–7 overlapping shapes with opacity between 0.15 and 0.55
- Always include a subtle radial or linear gradient overlay on the background
- Use <defs> with gradients and optionally a blur filter (feGaussianBlur, stdDeviation 20–60)
- No text, no icons, no recognizable real-world objects — purely abstract

CONTENT MAPPING:
- Movement/sport/exercise/training → green (#a6e3a1), teal (#94e2d5), angular or dynamic shapes
- Nutrition/food/eating → peach (#fab387), yellow (#f9e2af), rounded organic shapes
- Reflection/introspection/calm → mauve (#cba6f7), blue (#89b4fa), smooth large circles
- Challenges/difficulty/struggle → red (#f38ba8), sharp contrasts, fragmented shapes
- Nature/outdoors → green + teal, flowing curves
- Default → mauve + blue, balanced composition

OUTPUT: Return ONLY valid SVG markup. Start with <svg and end with </svg>. No other text, no markdown, no code fences.`

export async function generateBannerSvg(title: string, excerpt: string): Promise<string> {
  const userMessage = `Generate an abstract banner SVG for this journal entry:

Title: ${title}
Excerpt: ${excerpt || '(none)'}

Return only the SVG markup.`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const raw = message.content[0]
    if (raw.type !== 'text') throw new Error('Unerwarteter Antworttyp von Claude')

    const svg = raw.text.replace(/^```(?:svg)?\n?/, '').replace(/\n?```$/, '').trim()

    if (!svg.startsWith('<svg') || !svg.includes('</svg>')) {
      throw new Error('Claude hat kein gültiges SVG zurückgegeben')
    }

    return svg
  } catch (e) {
    if (e instanceof APIError) throw new Error(e.message)
    throw e
  }
}
