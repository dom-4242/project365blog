import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-14">
      {/* Habits skeleton */}
      <section>
        <div className="flex items-baseline gap-3 mb-5">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-ctp-surface1 overflow-hidden"
            >
              <div className="h-1 bg-ctp-surface0" />
              <div className="p-5 space-y-5">
                <Skeleton className="h-4 w-24" />
                <div className="space-y-2">
                  <Skeleton className="h-12 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-2 w-full" />
                  <div className="grid grid-cols-7 gap-1 mt-2">
                    {Array.from({ length: 28 }).map((_, j) => (
                      <Skeleton key={j} className="aspect-square rounded-sm" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Metrics skeleton */}
      <section>
        <Skeleton className="h-6 w-24 mb-5" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 rounded-2xl border border-ctp-surface1 p-5">
            <div className="flex justify-between mb-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-7 w-20" />
            </div>
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
          <div className="rounded-2xl border border-ctp-surface1 p-5">
            <div className="flex justify-between mb-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-7 w-16" />
            </div>
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
        </div>
      </section>

      {/* Journal feed skeleton */}
      <section>
        <Skeleton className="h-6 w-40 mb-5" />
        <div className="space-y-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-ctp-surface1 overflow-hidden"
            >
              <Skeleton className="h-36 w-full rounded-none" />
              <div className="p-6 space-y-3">
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
