import type { Community, CommunityMemberRole } from "@/types/database.types";
import type { SupabaseServerClient } from "./types";

export type UserCommunity = Community & { role: CommunityMemberRole };

export async function joinMembershipsWithCommunities(
  supabase: SupabaseServerClient,
  userId: string,
  limit?: number
): Promise<UserCommunity[]> {
  let query = supabase
    .from("community_members")
    .select("role, community_id")
    .eq("user_id", userId);

  if (limit) query = query.limit(limit);

  const { data: memberships } = await query;
  if (!memberships?.length) return [];

  const ids = memberships.map((m) => m.community_id);
  const { data: communities } = await supabase
    .from("communities")
    .select("*")
    .in("id", ids);

  if (!communities) return [];

  return memberships
    .map((m) => {
      const community = communities.find((c) => c.id === m.community_id);
      if (!community) return null;
      return { ...community, role: m.role };
    })
    .filter((c): c is UserCommunity => c !== null);
}
