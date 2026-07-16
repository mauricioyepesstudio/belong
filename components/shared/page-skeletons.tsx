import { Skeleton, SkeletonCard } from "@/components/ui";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 lg:space-y-10">
      <Skeleton className="h-44 rounded-3xl" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-12 xl:gap-5">
        <Skeleton className="h-64 rounded-2xl xl:col-span-5" />
        <Skeleton className="h-64 rounded-2xl xl:col-span-7" />
        <Skeleton className="h-56 rounded-2xl xl:col-span-4" />
        <Skeleton className="h-56 rounded-2xl xl:col-span-4" />
        <Skeleton className="h-56 rounded-2xl xl:col-span-4" />
        <Skeleton className="h-48 rounded-2xl xl:col-span-12" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-44 rounded-2xl" />
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-2xl" />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Skeleton className="h-80 rounded-2xl" />
      <div className="space-y-6 lg:col-span-2">
        <Skeleton className="h-12 rounded-xl" />
        <SkeletonCard />
      </div>
    </div>
  );
}

export function MessagesSkeleton() {
  return <Skeleton className="h-[480px] rounded-2xl" />;
}

export function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-12 rounded-xl" />
      <SkeletonCard />
    </div>
  );
}
