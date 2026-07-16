import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { joinMembershipsWithCommunities } from "@/lib/core";

export type { UserCommunity } from "@/lib/core";

export async function getUserCommunities() {
  const supabase = await createClient();
  const profile = await requireProfile();
  return joinMembershipsWithCommunities(supabase, profile.id);
}

export async function getDiscoverCommunities() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("communities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(24);
  return data ?? [];
}
