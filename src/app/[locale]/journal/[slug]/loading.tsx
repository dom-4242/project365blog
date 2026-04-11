import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Banner hero */}
      <Skeleton className="w-full aspect-[16/7] rounded-xl mb-8" />

      {/* Meta row + title */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-5 w-16 rounded" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-5/6" />
        <Skeleton className="h-9 w-3/4" />
      </div>

      {/* Habit badges */}
      <div className="flex gap-2 mb-8">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-7 w-28 rounded-full" />
        ))}
      </div>

      <Skeleton className="h-px w-full mb-8" />

      {/* Content lines */}
      <div className="space-y-3">
        {[100, 90, 95, 85, 92, 80, 70].map((w, i) => (
          <Skeleton key={i} className="h-4" style={{ width: `${w}%` }} />
        ))}
        <div className="pt-2" />
        {[88, 95, 75, 82].map((w, i) => (
          <Skeleton key={i} className="h-4" style={{ width: `${w}%` }} />
        ))}
      </div>

      {/* Reactions */}
      <div className="mt-14 pt-8 border-t border-outline-variant/20 space-y-3">
        <Skeleton className="h-3 w-20" />
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-full" />
          ))}
        </div>
      </div>
    </article>
  )
}
