"use client";

import { ErrorFallback } from "@/components/error/error-fallback";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#030014] text-white antialiased">
        <ErrorFallback error={error} reset={reset} title="Application error" />
      </body>
    </html>
  );
}
