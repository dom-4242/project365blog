'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

const REACTIONS = [
  { type: 'HEART', emoji: '❤️', label: 'Berührt mich' },
  { type: 'CLAP', emoji: '👏', label: 'Gut gemacht' },
  { type: 'FIRE', emoji: '🔥', label: 'Stark' },
  { type: 'MUSCLE', emoji: '💪', label: 'Motivierend' },
  { type: 'STAR', emoji: '⭐', label: 'Inspirierend' },
] as const

type ReactionType = (typeof REACTIONS)[number]['type']
type ReactionCounts = Record<ReactionType, number>

interface ReactionBarCompactProps {
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

export function ReactionBarCompact({ slug }: ReactionBarCompactProps) {
  const [counts, setCounts] = useState<ReactionCounts>(EMPTY_COUNTS)
  const [userReactions, setUserReactions] = useState<Set<ReactionType>>(new Set())
  const [pending, setPending] = useState<ReactionType | null>(null)
  const [mounted, setMounted] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setUserReactions(loadUserReactions(slug))
    setMounted(true)
  }, [slug])

  useEffect(() => {
    fetch(`/api/reactions?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data: { reactions?: ReactionCounts }) => {
        if (data.reactions) setCounts(data.reactions)
      })
      .catch(() => {})
  }, [slug])

  const handleReaction = useCallback(
    async (e: React.MouseEvent, type: ReactionType) => {
      e.preventDefault()
      e.stopPropagation()
      if (pending) return

      const wasActive = userReactions.has(type)
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
        if (data.action) {
          const reconciledReactions = new Set(userReactions)
          if (data.action === 'added') reconciledReactions.add(type)
          else reconciledReactions.delete(type)
          setUserReactions(reconciledReactions)
          saveUserReactions(slug, reconciledReactions)
        }
      } catch {
        setCounts(counts)
        setUserReactions(userReactions)
        saveUserReactions(slug, userReactions)
      } finally {
        setPending(null)
      }
    },
    [slug, counts, userReactions, pending],
  )

  const stopPropagation = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const activeReactions = REACTIONS.filter(({ type }) => counts[type] > 0)
  const inactiveReactions = REACTIONS.filter(({ type }) => counts[type] === 0)

  // Don't render until mounted (avoid SSR hydration issues)
  if (!mounted) return null

  return (
    <div
      className="flex items-center gap-1 flex-wrap"
      onClick={stopPropagation}
    >
      {/* Active reactions with counts */}
      {activeReactions.map(({ type, emoji, label }) => (
        <button
          key={type}
          onClick={(e) => handleReaction(e, type)}
          disabled={pending !== null}
          title={label}
          aria-label={`${label} (${counts[type]})`}
          aria-pressed={userReactions.has(type)}
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-150 select-none',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand-400',
            userReactions.has(type)
              ? 'bg-sand-200 dark:bg-[#4a4540] text-[#1a1714] dark:text-[#faf9f7] ring-1 ring-sand-300 dark:ring-[#5a5550]'
              : 'bg-sand-100 dark:bg-[#313244] border border-sand-200 dark:border-[#45475a] text-sand-500 dark:text-sand-400 hover:bg-sand-200 dark:hover:bg-[#3a3531] hover:text-sand-700 dark:hover:text-[#faf9f7]',
            pending !== null && 'opacity-60 cursor-not-allowed',
          )}
        >
          <span className="leading-none" aria-hidden="true">{emoji}</span>
          <span className="tabular-nums">{counts[type]}</span>
        </button>
      ))}

      {/* Expand toggle: show "+" or remaining inactive emojis */}
      {expanded ? (
        <>
          {inactiveReactions.map(({ type, emoji, label }) => (
            <button
              key={type}
              onClick={(e) => { handleReaction(e, type); setExpanded(false) }}
              disabled={pending !== null}
              title={label}
              aria-label={label}
              className={cn(
                'flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-150 select-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand-400',
                'bg-sand-100 dark:bg-[#313244] border border-dashed border-sand-300 dark:border-[#45475a] text-sand-400 dark:text-sand-500 hover:bg-sand-200 dark:hover:bg-[#3a3531] hover:text-sand-700 dark:hover:text-[#faf9f7] hover:border-solid',
                pending !== null && 'opacity-60 cursor-not-allowed',
              )}
            >
              <span className="leading-none" aria-hidden="true">{emoji}</span>
            </button>
          ))}
          <button
            onClick={(e) => { stopPropagation(e); setExpanded(false) }}
            aria-label="Schliessen"
            className="flex items-center justify-center w-5 h-5 rounded-full text-xs bg-sand-100 dark:bg-[#313244] border border-sand-200 dark:border-[#45475a] text-sand-400 hover:bg-sand-200 dark:hover:bg-[#3a3531] transition-all duration-150 select-none"
          >
            ×
          </button>
        </>
      ) : (
        <button
          onClick={(e) => { stopPropagation(e); setExpanded(true) }}
          aria-label="Reagieren"
          className="flex items-center justify-center w-5 h-5 rounded-full text-xs bg-sand-100 dark:bg-[#313244] border border-sand-200 dark:border-[#45475a] text-sand-400 hover:bg-sand-200 dark:hover:bg-[#3a3531] hover:text-sand-600 transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand-400"
        >
          +
        </button>
      )}
    </div>
  )
}
