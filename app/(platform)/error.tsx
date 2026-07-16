"use client";

import { ErrorFallback } from "@/components/error/error-fallback";

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="Failed to load page" />;
}
