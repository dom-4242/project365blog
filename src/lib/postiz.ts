/**
 * Thin wrapper around the self-hosted Postiz public API.
 * Docs: https://docs.postiz.com/public-api
 *
 * Requires POSTIZ_API_URL and POSTIZ_API_KEY in the environment. The URL
 * should include the public base path, e.g. `https://postiz.dom42.ch/api/public/v1`.
 */

export interface PostizIntegration {
  id: string
  name: string
  identifier: string // e.g. 'bluesky', 'instagram', 'threads'
  picture?: string
  disabled?: boolean
  profile?: string
}

export interface UploadedMedia {
  id: string
  path: string
}

export interface CreatePostInput {
  /** Channel IDs from listIntegrations(). Each id becomes a separate post block. */
  integrationIds: string[]
  /** Caption text — same for all selected channels. */
  content: string
  /** Optional public image URL. Postiz fetches it via /upload-from-url. */
  imageUrl?: string
  /**
   * Schedule mode. 'now' publishes immediately. 'schedule' requires a future
   * `date`. 'draft' stores without publishing. Default: 'now'.
   */
  type?: 'now' | 'schedule' | 'draft'
  /** ISO timestamp; required for `schedule`. Defaults to now. */
  date?: string
}

function getConfig() {
  const url = process.env.POSTIZ_API_URL?.replace(/\/$/, '')
  const key = process.env.POSTIZ_API_KEY
  if (!url) throw new Error('POSTIZ_API_URL nicht konfiguriert')
  if (!key) throw new Error('POSTIZ_API_KEY nicht konfiguriert')
  return { url, key }
}

async function postizFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, key } = getConfig()
  const headers = new Headers(init.headers)
  headers.set('Authorization', key)
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${url}${path}`, { ...init, headers, cache: 'no-store' })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Postiz ${res.status}: ${text || res.statusText}`)
  }
  return res.json() as Promise<T>
}

export function listIntegrations(): Promise<PostizIntegration[]> {
  return postizFetch<PostizIntegration[]>('/integrations')
}

export function uploadImageFromUrl(url: string): Promise<UploadedMedia> {
  return postizFetch<UploadedMedia>('/upload-from-url', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
}

export async function createPost(input: CreatePostInput): Promise<unknown> {
  if (input.integrationIds.length === 0) {
    throw new Error('Mindestens ein Channel muss ausgewählt sein')
  }

  const image = input.imageUrl
    ? [await uploadImageFromUrl(input.imageUrl)]
    : []

  const date = input.date ?? new Date().toISOString()

  const payload = {
    type: input.type ?? 'now',
    shortLink: false,
    date,
    tags: [],
    posts: input.integrationIds.map((id) => ({
      integration: { id },
      value: [{ content: input.content, image }],
      settings: {},
    })),
  }

  return postizFetch('/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
