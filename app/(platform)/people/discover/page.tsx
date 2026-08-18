import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import {
  discoverPeople,
  DISCOVERY_CATEGORIES,
  type DiscoveryCategory,
} from "@/engines/opportunity";
import { PeopleDiscoveryScreen } from "@/engines/opportunity/components/people-discovery-screen";

export const metadata: Metadata = { title: "Encuentra amigos" };

const PAGE_SIZE = 24;

function resolveCategory(raw: string | undefined): DiscoveryCategory {
  const categories: readonly string[] = DISCOVERY_CATEGORIES;
  return raw && categories.includes(raw) ? (raw as DiscoveryCategory) : "Todos";
}

export default async function PeopleDiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: rawCategory } = await searchParams;
  const category = resolveCategory(rawCategory);

  const supabase = await createClient();
  const profile = await requireProfile();
  const result = await discoverPeople(supabase, profile, {
    category,
    limit: PAGE_SIZE,
  });

  return <PeopleDiscoveryScreen initialCategory={category} initialResult={result} />;
}
