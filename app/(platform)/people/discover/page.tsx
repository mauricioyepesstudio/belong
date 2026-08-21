import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import {
  discoverPeople,
  DISCOVERY_CATEGORIES,
  type DiscoveryCategory,
} from "@/engines/opportunity";
import { PeopleDiscoveryScreen } from "@/engines/opportunity/components/people-discovery-screen";

export const metadata: Metadata = { title: "Discover people" };

const PAGE_SIZE = 24;

function resolveCategory(raw: string | undefined): DiscoveryCategory {
  const categories: readonly string[] = DISCOVERY_CATEGORIES;
  return raw && categories.includes(raw) ? (raw as DiscoveryCategory) : "All";
}

export default async function PeopleDiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: rawCategory } = await searchParams;
  const category = resolveCategory(rawCategory);

  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const result = await discoverPeople(supabase, profile, {
    category,
    limit: PAGE_SIZE,
  });

  return <PeopleDiscoveryScreen initialCategory={category} initialResult={result} />;
}
