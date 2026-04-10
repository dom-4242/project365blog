'use client'

import { useState, useEffect, useCallback } from 'react'
import { ReactionButton } from './ReactionButton'

const REACTIONS = [
  { type: 'HEART', emoji: '❤️', label: 'Berührt mich' },
  { type: 'CLAP', emoji: '👏', label: 'Gut gemacht' },
  { type: 'FIRE', emoji: '🔥', label: 'Stark' },
  { type: 'MUSCLE', emoji: '💪', label: 'Motivierend' },
  { type: 'STAR', emoji: '⭐', label: 'Inspirierend' },
] as const

type ReactionType = (typeof REACTIONS)[number]['type']
type ReactionCounts = Record<ReactionType, number>

interface ReactionBarProps {
  slug: string
}

function storageKey(slug: string) {
  return `reactions_${slug}`
}

function loadUserReactions(slug: string): Set<ReactionType> {
  try {
    const raw = localStorage.getItem(storageKey(slug))
    if (raw) return new Set(JSON.parse(raw) as ReactionType[])
  } catch {}
  return new Set()
}

function saveUserReactions(slug: string, reactions: Set<ReactionType>) {
  try {
    localStorage.setItem(storageKey(slug), JSON.stringify([...reactions]))
  } catch {}
}

const EMPTY_COUNTS: ReactionCounts = { HEART: 0, CLAP: 0, FIRE: 0, MUSCLE: 0, STAR: 0 }

export function ReactionBar({ slug }: ReactionBarProps) {
  const [counts, setCounts] = useState<ReactionCounts>(EMPTY_COUNTS)
  const [userReactions, setUserReactions] = useState<Set<ReactionType>>(new Set())
  const [pending, setPending] = useState<ReactionType | null>(null)
  const [mounted, setMounted] = useState(false)

  // Hydrate localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    setUserReactions(loadUserReactions(slug))
    setMounted(true)
  }, [slug])

  // Fetch fresh counts on mount
  useEffect(() => {
    fetch(`/api/reactions?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data: { reactions?: ReactionCounts }) => {
        if (data.reactions) setCounts(data.reactions)
      })
      .catch(() => {})
  }, [slug])

  const handleReaction = useCallback(
    async (type: ReactionType) => {
      if (pending) return

      const wasActive = userReactions.has(type)

      // Optimistic update
      const optimisticCounts = {
        ...counts,
        [type]: Math.max(0, (counts[type] ?? 0) + (wasActive ? -1 : 1)),
      }
      const optimisticUserReactions = new Set(userReactions)
      if (wasActive) {
        optimisticUserReactions.delete(type)
      } else {
        optimisticUserReactions.add(type)
      }
      setCounts(optimisticCounts)
      setUserReactions(optimisticUserReactions)
      saveUserReactions(slug, optimisticUserReactions)
      setPending(type)

      try {
        const res = await fetch('/api/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, emoji: type }),
        })
        const data: { action?: 'added' | 'removed'; reactions?: ReactionCounts } = await res.json()

        if (data.reactions) setCounts(data.reactions)

        // Reconcile localStorage with server's actual action
        if (data.action) {
          const reconciledReactions = new Set(userReactions)
          if (data.action === 'added') {
            reconciledReactions.add(type)
          } else {
            reconciledReactions.delete(type)
          }
          setUserReactions(reconciledReactions)
          saveUserReactions(slug, reconciledReactions)
        }
      } catch {
        // Revert optimistic update on network error
        setCounts(counts)
        setUserReactions(userReactions)
        saveUserReactions(slug, userReactions)
      } finally {
        setPending(null)
      }
    },
    [slug, counts, userReactions, pending],
  )

  return (
    <div className="space-y-2">
      <p className="text-xs text-on-surface-variant uppercase tracking-wider font-medium">Reaktionen</p>
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map(({ type, emoji, label }) => (
          <ReactionButton
            key={type}
            emoji={emoji}
            label={label}
            count={counts[type] ?? 0}
            active={mounted && userReactions.has(type)}
            disabled={pending !== null}
            onClick={() => handleReaction(type)}
          />
        ))}
      </div>
    </div>
  )
}
