"use client";

import { Button } from "@/components/ui";
import Link from "next/link";

type ErrorFallbackProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
};

export function ErrorFallback({ error, reset, title = "Something went wrong" }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-error/10 border border-error/20">
        <span className="text-2xl" aria-hidden>!</span>
      </div>
      <h2 className="mt-6 text-heading text-fg-primary">{title}</h2>
      <p className="mt-2 max-w-md text-body">{error.message || "An unexpected error occurred."}</p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/dashboard">
          <Button variant="secondary">Go home</Button>
        </Link>
      </div>
    </div>
  );
}
