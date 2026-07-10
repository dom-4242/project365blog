export interface MetricsBannerContext {
  dayNumber?: number
  movement: 'MINIMAL' | 'STEPS_ONLY' | 'TRAINED_ONLY' | 'STEPS_TRAINED'
  nutrition: 'FULFILLED' | 'NOT_FULFILLED' | 'OPEN'
  smoking: 'SMOKED' | 'NICOTINE_REPLACEMENT' | 'SMOKE_FREE'
  steps?: number | null
}

function moodForMovement(level: MetricsBannerContext['movement'], steps?: number | null): string {
  if (level === 'STEPS_TRAINED') return 'kinetic momentum, sustained motion, energy'
  if (level === 'TRAINED_ONLY') return 'focused exertion, controlled intensity'
  if (level === 'STEPS_ONLY') return 'steady rhythm, walking forward, persistence'
  return steps != null && steps > 5000 ? 'low movement, drag, weight' : 'stillness, dormancy, quiet'
}

function moodForNutrition(level: MetricsBannerContext['nutrition']): string {
  if (level === 'FULFILLED') return 'nourished warmth, balance, fullness'
  if (level === 'NOT_FULFILLED') return 'depletion, scarcity, hollow'
  return 'quiet neutrality, undetermined'
}

function moodForSmoking(level: MetricsBannerContext['smoking']): string {
  if (level === 'SMOKE_FREE') return 'clear breath, openness, freedom'
  if (level === 'NICOTINE_REPLACEMENT') return 'controlled willpower, focus, restraint'
  return 'gravity, return, lingering weight'
}

// Rotierende Stil-Modifikatoren — bringen Variation bei gleichem Grundstil.
const STYLE_VARIATIONS = [
  'caustic light filtering through haze, painterly impasto textures',
  'volumetric fog, long-exposure motion blur, soft chromatic bleed',
  'rim-lit silhouettes of abstract shapes, deep negative space',
  'dust particles drifting in directional light, grainy film texture',
  'liquid metal reflections, glassy refractions, prismatic edges',
  'wind-swept smoke trails, dynamic diagonal composition',
  'molten lava-like gradients, ember glow, charred edges',
  'crystalline shard patterns, sharp specular highlights',
  'oil-on-water iridescence, blooming light spills',
  'wet ink bleeding on dark paper, organic flowing forms',
  'soft focus bokeh orbs, dreamlike atmospheric depth',
  'torn paper layers, collage texture, brutalist composition',
]

function pickStyle(seed: number): string {
  return STYLE_VARIATIONS[seed % STYLE_VARIATIONS.length]
}

function buildMetricsPrompt(ctx: MetricsBannerContext): string {
  const moods = [
    moodForMovement(ctx.movement, ctx.steps),
    moodForNutrition(ctx.nutrition),
    moodForSmoking(ctx.smoking),
  ]
  const variation = pickStyle(ctx.dayNumber ?? Math.floor(Date.now() / 86_400_000))

  return `Wide cinematic abstract banner for ${
    ctx.dayNumber ? `day ${ctx.dayNumber} of ` : ''
  }a personal habit-tracking journey.

Mood signals: ${moods.join('; ')}.

Visual treatment: ${variation}.

Core style: dark moody atmosphere, deep blacks and dark grays base, warm accent lighting in orange (#ff8f70) and coral tones, cinematic horizontal landscape composition, dramatic light and shadow, painterly textures, atmospheric haze, editorial photography sensibility. Pure abstract — no figures, no objects, no text, no letters, no symbols. Translate the mood signals into pure atmosphere through light, color, and texture.`
}

function buildPrompt(title: string, excerpt: string): string {
  const variation = pickStyle(hashString(title))

  return `Wide cinematic banner image for a personal journal entry.

Title: "${title}"
${excerpt ? `Summary: "${excerpt}"` : ''}

Visual treatment: ${variation}.

Core style: dark moody atmosphere, deep blacks and dark grays base, warm accent lighting in orange (#ff8f70) and coral tones, cinematic horizontal landscape composition, abstract or semi-abstract (evoke mood, not literal illustration), dramatic light and shadow, painterly textures, atmospheric haze, editorial photography sensibility. No text, no letters, no words in the image. Should feel personal, introspective, and emotionally aligned with the entry.`
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

interface FalImageResult {
  images?: Array<{ url: string }>
  detail?: string
}

async function generateFromPrompt(prompt: string): Promise<Buffer> {
  const key = process.env.FAL_KEY
  if (!key) throw new Error('FAL_KEY nicht konfiguriert')

  const res = await fetch('https://fal.run/fal-ai/flux-pro/v1.1', {
    method: 'POST',
    headers: {
      Authorization: `Key ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_size: 'landscape_16_9',
      num_images: 1,
      enable_safety_checker: true,
      output_format: 'jpeg',
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`fal.ai FLUX request failed: ${res.status} ${text.slice(0, 200)}`)
  }

  const json = (await res.json()) as FalImageResult
  const url = json.images?.[0]?.url
  if (!url) throw new Error(`fal.ai response without image url: ${JSON.stringify(json).slice(0, 200)}`)

  const imgRes = await fetch(url)
  if (!imgRes.ok) throw new Error(`Fetching generated image failed: ${imgRes.status}`)
  const arr = await imgRes.arrayBuffer()
  return Buffer.from(arr)
}

export async function generateBannerImage(title: string, excerpt: string): Promise<Buffer> {
  return generateFromPrompt(buildPrompt(title, excerpt))
}

export async function generateBannerFromMetrics(ctx: MetricsBannerContext): Promise<Buffer> {
  return generateFromPrompt(buildMetricsPrompt(ctx))
}
