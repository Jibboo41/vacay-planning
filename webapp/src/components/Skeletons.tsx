import { Skeleton } from './ui';

/** Placeholder for the timeline while trips are loading. */
export function TimelineSkeleton() {
  return (
    <div role="status" aria-label="Loading itinerary" className="flex flex-col gap-4 px-4 pt-[calc(env(safe-area-inset-top)+20px)] pb-32 md:px-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-9 w-20 rounded-full" />)}
      </div>
      {Array.from({ length: 3 }, (_, day) => (
        <div key={day} className="flex flex-col gap-3">
          <Skeleton className="mt-2 h-5 w-28" />
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="flex gap-3 rounded-card border border-white/6 bg-white/4 p-4">
              <Skeleton className="size-11 shrink-0 rounded-control" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Placeholder for the trip selector list. */
export function TripListSkeleton() {
  return (
    <div role="status" aria-label="Loading trips" className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-6 pt-[calc(env(safe-area-inset-top)+32px)]">
      <Skeleton className="mb-4 h-9 w-40" />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-card border border-white/6 bg-white/4 p-4">
          <Skeleton className="size-12 shrink-0 rounded-control" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Generic screen placeholder. */
export function ScreenSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-4 px-6 pt-[calc(env(safe-area-inset-top)+20px)]">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full rounded-card" />
      <Skeleton className="h-24 w-full rounded-card" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
