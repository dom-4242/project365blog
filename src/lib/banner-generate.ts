import OpenAI from 'openai'

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY nicht konfiguriert')
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export interface MetricsBannerContext {
  dayNumber?: number
  movement: 'MINIMAL' | 'STEPS_ONLY' | 'TRAINED_ONLY' | 'STEPS_TRAINED'
  nutrition: 'NONE' | 'ONE_MEAL' | 'TWO_MEALS' | 'THREE_MEALS'
  smoking: 'SMOKED' | 'NICOTINE_REPLACEMENT' | 'SMOKE_FREE'
  mealScore?: number | null
  steps?: number | null
}

function moodForMovement(level: MetricsBannerContext['movement'], steps?: number | null): string {
  if (level === 'STEPS_TRAINED') return 'kinetic momentum, sustained motion, energy'
  if (level === 'TRAINED_ONLY') return 'focused exertion, controlled intensity'
  if (level === 'STEPS_ONLY') return 'steady rhythm, walking forward, persistence'
  return steps != null && steps > 5000 ? 'low movement, drag, weight' : 'stillness, dormancy, quiet'
}

function moodForNutrition(level: MetricsBannerContext['nutrition'], score?: number | null): string {
  if (score != null) {
    if (score >= 8) return 'nourished warmth, balance, fullness'
    if (score >= 5) return 'mixed signals, partial nourishment'
    return 'depletion, scarcity, hollow'
  }
  if (level === 'THREE_MEALS') return 'nourished warmth, balance'
  if (level === 'TWO_MEALS') return 'measured sustenance'
  if (level === 'ONE_MEAL') return 'sparse nourishment'
  return 'hunger, void, scarcity'
}

function moodForSmoking(level: MetricsBannerContext['smoking']): string {
  if (level === 'SMOKE_FREE') return 'clear breath, openness, freedom'
  if (level === 'NICOTINE_REPLACEMENT') return 'controlled willpower, focus, restraint'
  return 'gravity, return, lingering weight'
}

function buildMetricsPrompt(ctx: MetricsBannerContext): string {
  const moods = [
    moodForMovement(ctx.movement, ctx.steps),
    moodForNutrition(ctx.nutrition, ctx.mealScore),
    moodForSmoking(ctx.smoking),
  ]

  return `Create a wide cinematic abstract banner image for ${
    ctx.dayNumber ? `day ${ctx.dayNumber} of ` : ''
  }a personal habit-tracking journey.

Mood signals for today: ${moods.join('; ')}.

Style requirements:
- Dark, moody atmosphere with deep blacks and dark grays as the base
- Warm accent lighting in orange (#ff8f70) and coral tones
- Cinematic wide-format composition (horizontal, landscape orientation)
- Pure abstract — no figures, no objects, no text, no letters, no symbols
- Dramatic light, shadow, gradients, atmospheric haze, painterly textures
- Minimal, introspective, reminiscent of dark editorial photography and abstract digital art
- Inspired by: cinematic stills, light studies, atmospheric paintings

Translate the mood signals into pure atmosphere — let light, color and texture express the emotional weight of those signals without depicting anything literal.`
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

async function generateFromPrompt(prompt: string): Promise<Buffer> {
  const response = await getClient().images.generate({
    model: 'gpt-image-1-mini',
    prompt,
    n: 1,
    size: '1536x1024',
    quality: 'medium',
  })

  const b64 = response.data?.[0]?.b64_json
  if (!b64) throw new Error('Image-Model hat kein Bild zurückgegeben')

  return Buffer.from(b64, 'base64')
}

export async function generateBannerImage(title: string, excerpt: string): Promise<Buffer> {
  return generateFromPrompt(buildPrompt(title, excerpt))
}

export async function generateBannerFromMetrics(ctx: MetricsBannerContext): Promise<Buffer> {
  return generateFromPrompt(buildMetricsPrompt(ctx))
}

// Legacy SVG-Generator — wird nicht mehr verwendet, bleibt für Fallback
export { generateBannerImage as generateBannerSvg }
