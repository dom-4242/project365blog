import OpenAI from 'openai'

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY nicht konfiguriert')
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

function buildPrompt(title: string, excerpt: string): string {
  return `Create a wide cinematic banner image for a personal journal entry.

Journal title: "${title}"
${excerpt ? `Summary: "${excerpt}"` : ''}

Style requirements:
- Dark, moody atmosphere with deep blacks and dark grays as the base
- Warm accent lighting in orange (#ff8f70) and coral tones
- Cinematic wide-format composition (horizontal, landscape orientation)
- Abstract or semi-abstract — evoke the mood and theme of the text, NOT literal illustration
- Dramatic use of light, shadow, and depth
- Minimal, clean — no text, no words, no letters in the image
- Subtle textures, gradients, atmospheric haze
- Inspired by: dark editorial photography, abstract digital art, cinematic stills

The image should feel personal, introspective, and visually match the emotional tone of the journal entry.`
}

export async function generateBannerImage(title: string, excerpt: string): Promise<Buffer> {
  const response = await getClient().images.generate({
    model: 'dall-e-3',
    prompt: buildPrompt(title, excerpt),
    n: 1,
    size: '1792x1024',
    quality: 'standard',
    response_format: 'b64_json',
  })

  const b64 = response.data?.[0]?.b64_json
  if (!b64) throw new Error('DALL-E hat kein Bild zurückgegeben')

  return Buffer.from(b64, 'base64')
}

// Legacy SVG-Generator — wird nicht mehr verwendet, bleibt für Fallback
export { generateBannerImage as generateBannerSvg }
