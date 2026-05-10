'use client'

import { useEffect, useState, useTransition } from 'react'
import { clsx } from 'clsx'
import { listSocialChannels, publishEntryToSocial } from '@/app/admin/entries/social-actions'

interface PostizIntegration {
  id: string
  name: string
  identifier: string
  picture?: string
  profile?: string
}

interface Props {
  entryId: string
  defaultCaption: string
  onClose: () => void
}

const PLATFORM_LABELS: Record<string, string> = {
  bluesky: 'Bluesky',
  instagram: 'Instagram',
  threads: 'Threads',
  twitter: 'X / Twitter',
  mastodon: 'Mastodon',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
}

function platformLabel(identifier: string): string {
  return PLATFORM_LABELS[identifier] ?? identifier
}

export function SocialPostDialog({ entryId, defaultCaption, onClose }: Props) {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [integrations, setIntegrations] = useState<PostizIntegration[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [caption, setCaption] = useState(defaultCaption)
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    listSocialChannels().then((result) => {
      if (cancelled) return
      if (result.error) {
        setLoadError(result.error)
      } else if (result.integrations) {
        setIntegrations(result.integrations)
        setSelected(new Set(result.integrations.map((i) => i.id)))
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSend() {
    setFeedback(null)
    startTransition(async () => {
      const result = await publishEntryToSocial({
        entryId,
        integrationIds: Array.from(selected),
        caption,
      })
      if (result.error) {
        setFeedback({ kind: 'error', text: result.error })
      } else {
        setFeedback({ kind: 'ok', text: 'Erfolgreich gepostet' })
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg rounded-xl bg-surface-container border border-outline-variant/20 p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="font-headline text-lg font-bold text-on-surface">An Social Media senden</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface text-sm"
          >
            ✕
          </button>
        </div>

        {/* Channels */}
        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Channels</label>
          {loading ? (
            <p className="text-sm text-on-surface-variant">Lade Channels …</p>
          ) : loadError ? (
            <p className="text-sm text-error">{loadError}</p>
          ) : integrations.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              Keine Channels in Postiz verbunden. Verbinde zuerst ein Konto in der Postiz-UI.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {integrations.map((i) => (
                <label
                  key={i.id}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors',
                    selected.has(i.id)
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-outline-variant/20 hover:border-outline-variant/40',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(i.id)}
                    onChange={() => toggle(i.id)}
                    className="accent-primary"
                  />
                  <span className="text-sm text-on-surface">
                    {platformLabel(i.identifier)}
                    {i.profile && (
                      <span className="text-on-surface-variant font-normal"> · {i.profile}</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Caption */}
        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Text</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={6}
            className="w-full border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-outline-variant bg-surface-container-low resize-none"
          />
          <p className="mt-1 text-xs text-on-surface-variant">
            {caption.length} Zeichen · Bluesky-Limit: 300
          </p>
        </div>

        {feedback && (
          <p
            className={clsx(
              'text-sm rounded-lg px-3 py-2',
              feedback.kind === 'ok'
                ? 'bg-movement-900/20 text-movement-300'
                : 'bg-secondary/10 text-secondary',
            )}
          >
            {feedback.text}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/15">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-on-surface-variant hover:text-on-surface px-3 py-2"
          >
            {feedback?.kind === 'ok' ? 'Schliessen' : 'Abbrechen'}
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isPending || selected.size === 0 || !caption.trim() || feedback?.kind === 'ok'}
            className="px-4 py-2 bg-primary text-surface-container rounded-lg text-sm font-medium hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Sende …' : 'Jetzt posten'}
          </button>
        </div>
      </div>
    </div>
  )
}
