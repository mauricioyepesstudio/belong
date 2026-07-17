import { SearchScreen } from "@/engines/belong/components/search-screen";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { searchGlobal } from "@/lib/core/search";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Search" };

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const supabase = await createClient();
  const profile = await requireProfile();
  const results = q.trim().length >= 2 ? await searchGlobal(supabase, profile.id, q) : [];

  return <SearchScreen results={results} query={q.trim()} />;
}
