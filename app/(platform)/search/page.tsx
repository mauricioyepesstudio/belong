import { SearchScreen } from "@/engines/belong/components/search-screen";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { searchGlobal } from "@/lib/core/search";
import {
  AnalyticsScreen,
  AnalyticsSource,
  trackServerEvent,
} from "@/systems/analytics/track-server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Search" };

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const trimmed = q.trim();
  let results: Awaited<ReturnType<typeof searchGlobal>> = [];
  let error: string | null = null;

  if (trimmed.length >= 2) {
    try {
      const supabase = await createClient();
      const profile = await requireProfile();
      results = await searchGlobal(supabase, profile.id, trimmed);
      await trackServerEvent({
        name: "search_used",
        userId: profile.id,
        screen: AnalyticsScreen.SEARCH,
        source: AnalyticsSource.SEARCH_GLOBAL,
        properties: { query_length: trimmed.length, result_count: results.length },
      });
    } catch {
      error = "Search failed. Please try again.";
    }
  }

  return <SearchScreen results={results} query={trimmed} error={error} />;
}
