import Anthropic, { APIError } from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a creative SVG designer specializing in bold abstract geometric banner artwork for a personal journal website.

Your task: Generate a visually striking abstract SVG banner (1200×420px viewBox) based on the given journal entry.

STYLE RULES (follow strictly for visual consistency across all banners):
- Bold geometric composition: mix circles, rotated rectangles (rx 24–60), triangular polygons, and ellipses
- Vary shape types within each banner — never use only circles. Include at least 2 different shape types (polygons, rects, circles)
- Use 8–14 overlapping shapes for depth and richness
- Opacity range: 0.2–0.55 (higher than subtle — shapes must be clearly visible against the dark background)
- Include 2–3 small accent shapes (r 15–35) with higher opacity (0.4–0.55) as focal points
- Kinetic Lab color palette only:
  Background: #0e0e0e
  Accent colors: #ff8f70 (primary/warm orange), #ff7852 (primary-container), #ff734c (primary-dim), #fc7c7c (secondary/coral), #eaa5ff (tertiary/purple), #ff716c (error/red)
  Surface colors for depth: #1a1919, #201f1f, #262626, #2c2c2c
- Always start with a diagonal linear gradient overlay (#1a1919 to #0e0e0e) for depth
- Use 1–2 surface-colored shapes (#201f1f, #262626) at 0.4–0.55 opacity as grounding mid-layer elements
- Rotated rectangles: use transform="rotate(8–20deg)" for dynamism
- Distribute shapes across the full canvas — avoid clustering everything in one area

CONTENT MAPPING (determines dominant colors and shape language):
- Movement/sport/training → dominant: orange (#ff8f70) + primary-dim (#ff734c), angular polygons, triangles pointing upward, diagonal energy
- Nutrition/food/eating → dominant: coral (#fc7c7c) + orange (#ff8f70), rounded rects, organic ellipses
- Reflection/introspection/calm → dominant: purple (#eaa5ff) + coral (#fc7c7c), large circles, smooth rounded rects
- Challenges/difficulty/struggle → dominant: red (#ff716c) + purple (#eaa5ff), sharp polygons, fragmented layout, tilted rects
- Achievement/pride/milestones → dominant: orange (#ff8f70) + purple (#eaa5ff), bold shapes, high-opacity accents
- Nature/outdoors → dominant: orange (#ff8f70) + purple (#eaa5ff) + coral (#fc7c7c), flowing forms
- Mixed/default → dominant: orange (#ff8f70) + purple (#eaa5ff), balanced mix of shapes
- Always add 1–2 secondary accent colors from other categories for visual interest

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
