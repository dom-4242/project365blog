import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <article className="max-w-2xl mx-auto px-4 py-10">
      <Skeleton className="h-4 w-28 mb-8" />
      <Skeleton className="h-52 w-full rounded-2xl mb-8" />
      <div className="space-y-3 mb-8">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-9 w-5/6" />
        <Skeleton className="h-9 w-3/4" />
      </div>
      <div className="flex gap-2 mb-8">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>
      <div className="space-y-3">
        {[100, 90, 95, 85, 92, 80, 70].map((w, i) => (
          <Skeleton key={i} className="h-4" style={{ width: `${w}%` }} />
        ))}
        <div className="pt-2" />
        {[88, 95, 75, 82].map((w, i) => (
          <Skeleton key={i} className="h-4" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="mt-12 pt-8 border-t border-sand-200 dark:border-[#3a3531] space-y-3">
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
