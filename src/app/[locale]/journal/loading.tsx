import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      {/* Header */}
      <div className="mb-10 space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-3 w-24" />
      </div>

      {/* 2-column grid of card skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-surface-variant/40 border border-outline-variant/15 rounded-xl overflow-hidden"
          >
            <Skeleton className="w-full aspect-[16/7] rounded-none" />
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-5 w-14 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-5/6" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-2">
                  {[0, 1, 2].map((j) => (
                    <Skeleton key={j} className="h-6 w-20 rounded-full" />
                  ))}
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
