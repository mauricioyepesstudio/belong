"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useCallback, useTransition, type FormEvent } from "react";
import type { SearchResult } from "@/lib/core/search";
import { SearchResultsView } from "@/engines/belong/components/search-results";

export function SearchScreen({
  results,
  query,
  error,
}: {
  results: SearchResult[];
  query: string;
  error?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const input = form.elements.namedItem("q") as HTMLInputElement;
      const next = input.value.trim();
      startTransition(() => {
        router.push(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
      });
    },
    [router]
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-8">
      <div>
        <p className="text-label">Global search</p>
        <h1 className="text-heading-lg mt-2 text-fg-primary">Search BELONG</h1>
        <p className="text-body mt-2 text-fg-secondary">
          People, communities, projects, posts, and missions — one query across everything.
        </p>
      </div>

      <form onSubmit={onSubmit} className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-fg-muted"
          aria-hidden
        />
        <input
          name="q"
          type="search"
          defaultValue={searchParams.get("q") ?? query}
          placeholder="Search people, communities, projects…"
          className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] py-3.5 pl-12 pr-4 text-sm text-fg-primary placeholder:text-fg-faint focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
          autoFocus
        />
        {pending && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-micro text-fg-muted">
            Searching…
          </span>
        )}
      </form>

      {error && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <SearchResultsView query={query} results={results} />
    </div>
  );
}
