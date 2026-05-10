'use server'

import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { SITE_URL } from '@/lib/site'
import {
  listIntegrations,
  createPost,
  type PostizIntegration,
} from '@/lib/postiz'
export interface ChannelsResult {
  integrations?: PostizIntegration[]
  error?: string
}

export async function listSocialChannels(): Promise<ChannelsResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  try {
    const integrations = await listIntegrations()
    return { integrations: integrations.filter((i) => !i.disabled) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Fehler beim Laden der Channels' }
  }
}

export interface PublishInput {
  entryId: string
  integrationIds: string[]
  caption: string
}

export interface PublishResult {
  ok?: boolean
  error?: string
}

export async function publishEntryToSocial(input: PublishInput): Promise<PublishResult> {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht autorisiert' }

  if (!input.caption.trim()) return { error: 'Text ist leer' }
  if (input.integrationIds.length === 0) return { error: 'Mindestens ein Channel auswählen' }

  const entry = await prisma.journalEntry.findUnique({
    where: { id: input.entryId },
    select: { bannerUrl: true },
  })
  if (!entry) return { error: 'Eintrag nicht gefunden' }

  // Banner: relative URLs müssen für Postiz absolut sein, damit /upload-from-url
  // sie fetchen kann. Externe URLs werden direkt durchgereicht.
  let imageUrl: string | undefined
  if (entry.bannerUrl) {
    imageUrl = entry.bannerUrl.startsWith('http')
      ? entry.bannerUrl
      : `${SITE_URL}${entry.bannerUrl}`
  }

  try {
    await createPost({
      integrationIds: input.integrationIds,
      content: input.caption,
      imageUrl,
      type: 'now',
    })
    return { ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Posting fehlgeschlagen' }
  }
}

