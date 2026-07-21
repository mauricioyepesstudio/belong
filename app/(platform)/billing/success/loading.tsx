import { Skeleton } from "@/components/ui";

export default function BillingSuccessLoading() {
  return (
    <div className="mx-auto max-w-md space-y-4 py-8">
      <Skeleton className="mx-auto h-12 w-12 rounded-full" />
      <Skeleton className="mx-auto h-6 w-48" />
      <Skeleton className="h-4 w-full" />
      <div className="flex justify-center gap-3 pt-2">
        <Skeleton className="h-10 w-28 rounded-xl" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
    </div>
  );
}
