import { Skeleton } from "@/components/ui";

export default function OnboardingLoading() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12">
      <Skeleton className="mb-8 h-10 w-48" />
      <Skeleton className="mb-4 h-64 rounded-2xl" />
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}
