"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { discoverPeople } from "@/engines/opportunity";
import type { DiscoverPeopleResult, DiscoveryCategory } from "@/engines/opportunity";

const PAGE_SIZE = 24;

/**
 * Server action used only for the "load more" pagination affordance on the
 * people discovery screen. Category-switch fetches instead go through the
 * page's own searchParams re-render (see app/(platform)/people/discover) so
 * the first page of every category always benefits from full SSR — this
 * action only covers the incremental pages after that.
 *
 * Thin wrapper: no new logic beyond auth + calling the existing
 * discoverPeople pipeline (engines/opportunity/discovery.ts, unmodified).
 */
export async function loadMoreDiscoveryPeople(
  category: DiscoveryCategory,
  offset: number
): Promise<DiscoverPeopleResult | { error: string }> {
  try {
    const supabase = await createClient();
    const profile = await requireProfile();
    return await discoverPeople(supabase, profile, { category, offset, limit: PAGE_SIZE });
  } catch {
    return { error: "No pudimos cargar más personas. Intenta de nuevo." };
  }
}
