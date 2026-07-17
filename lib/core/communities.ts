import type { Community, CommunityMemberRole } from "@/types/database.types";
import type { SupabaseServerClient } from "./types";

export type UserCommunity = Community & {
  role: CommunityMemberRole;
  memberCount: number;
  joinedAt: string;
};

export async function joinMembershipsWithCommunities(
  supabase: SupabaseServerClient,
  userId: string,
  limit?: number
): Promise<UserCommunity[]> {
  let query = supabase
    .from("community_members")
    .select("role, community_id, joined_at")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data: memberships } = await query;
  if (!memberships?.length) return [];

  const ids = memberships.map((m) => m.community_id);
  const [{ data: communities }, { data: allMembers }] = await Promise.all([
    supabase.from("communities").select("*").in("id", ids),
    supabase.from("community_members").select("community_id").in("community_id", ids),
  ]);

  if (!communities) return [];

  const memberCounts = new Map<string, number>();
  for (const row of allMembers ?? []) {
    memberCounts.set(row.community_id, (memberCounts.get(row.community_id) ?? 0) + 1);
  }

  return memberships
    .map((m) => {
      const community = communities.find((c) => c.id === m.community_id);
      if (!community) return null;
      return {
        ...community,
        role: m.role,
        memberCount: memberCounts.get(m.community_id) ?? 1,
        joinedAt: m.joined_at,
      };
    })
    .filter((c): c is UserCommunity => c !== null);
}
