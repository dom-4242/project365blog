'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { clsx } from 'clsx'
import { Icon } from '@/components/ui/Icon'
import { SectionCard, formatDate } from './shared'
import type { CoachBodyPhoto } from '@/lib/coach'

const CATEGORY_KEY: Record<string, string> = {
  FRONT: 'front',
  SIDE: 'side',
  BACK: 'back',
}

function PhotoImg({ photo, className }: { photo: CoachBodyPhoto; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/coach/body-photos/${photo.id}`}
      alt=""
      className={className}
      loading="lazy"
    />
  )
}

export function PhotoCompareGallery({ photos }: { photos: CoachBodyPhoto[] }) {
  const t = useTranslations('Coach')
  const locale = useLocale()
  // selected holds up to two photo ids (order = left, right)
  const [selected, setSelected] = useState<string[]>([])

  function toggle(id: string) {
    setSelected((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id)
      if (cur.length >= 2) return [cur[1], id] // drop the oldest
      return [...cur, id]
    })
  }

  const byId = new Map(photos.map((p) => [p.id, p]))
  const left = selected[0] ? byId.get(selected[0]) : undefined
  const right = selected[1] ? byId.get(selected[1]) : undefined

  return (
    <SectionCard
      title={t('photoGallery')}
      action={
        selected.length > 0 ? (
          <button
            type="button"
            onClick={() => setSelected([])}
            className="text-xs text-on-surface-variant hover:text-on-surface"
          >
            {t('clearSelection')}
          </button>
        ) : (
          <span className="text-[10px] text-on-surface-variant">{t('selectTwo')}</span>
        )
      }
    >
      {photos.length === 0 ? (
        <p className="text-sm text-on-surface-variant">{t('noPhotos')}</p>
      ) : (
        <>
          {/* Side-by-side comparison */}
          {(left || right) && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[left, right].map((p, i) => (
                <div
                  key={i}
                  className="rounded-lg overflow-hidden border border-outline-variant/15 bg-surface-container-lowest"
                >
                  {p ? (
                    <>
                      <PhotoImg photo={p} className="w-full h-64 object-cover" />
                      <p className="text-[11px] text-on-surface-variant px-2 py-1 text-center tabular-nums">
                        {formatDate(p.date, locale)} · {t(CATEGORY_KEY[p.category] ?? 'front')}
                      </p>
                    </>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-on-surface-variant text-xs">
                      {t('pickAnother')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Thumbnail grid */}
          <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
            {photos.map((p) => {
              const idx = selected.indexOf(p.id)
              const isSel = idx !== -1
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className={clsx(
                    'relative rounded-md overflow-hidden border-2 transition-colors group',
                    isSel ? 'border-primary' : 'border-transparent hover:border-outline-variant/40',
                  )}
                  title={`${formatDate(p.date, locale)} · ${t(CATEGORY_KEY[p.category] ?? 'front')}`}
                >
                  <PhotoImg photo={p} className="w-full h-20 object-cover" />
                  {isSel && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-surface-container-lowest flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                  )}
                  <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[9px] py-0.5 text-center tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatDate(p.date, locale)}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </SectionCard>
  )
}
