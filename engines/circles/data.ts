import type { SupabaseServerClient } from "@/lib/core/types";
import type {
  AccountabilityCircle,
  AccountabilityCircleMemberRow,
  AccountabilityCircleRow,
  CircleMember,
} from "./types";

type MemberProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

function toCircleMember(
  row: AccountabilityCircleMemberRow,
  userMap: Map<string, MemberProfileRow>
): CircleMember {
  const profile = userMap.get(row.user_id);
  return {
    id: row.id,
    circleId: row.circle_id,
    role: row.role,
    status: row.status,
    joinedAt: row.joined_at,
    createdAt: row.created_at,
    user: {
      id: row.user_id,
      fullName: profile?.full_name ?? "Builder",
      avatarUrl: profile?.avatar_url ?? null,
      role: profile?.role ?? null,
    },
  };
}

function toAccountabilityCircle(
  row: AccountabilityCircleRow,
  membersByCircle: Map<string, AccountabilityCircleMemberRow[]>,
  userMap: Map<string, MemberProfileRow>
): AccountabilityCircle {
  const memberRows = membersByCircle.get(row.id) ?? [];
  const members = memberRows
    .map((memberRow) => toCircleMember(memberRow, userMap))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const memberCount = members.filter(
    (member) => member.status === "invited" || member.status === "active"
  ).length;

  return {
    id: row.id,
    name: row.name,
    goalDescription: row.goal_description,
    creatorId: row.creator_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    members,
    memberCount,
  };
}

/**
 * Reads every accountability circle a user is an active member or creator
 * of, including the full member roster of each. This is an RSC-safe read:
 * it never mutates and relies on RLS to already scope rows to the caller.
 */
export async function listMyCircles(
  supabase: SupabaseServerClient,
  userId: string
): Promise<AccountabilityCircle[]> {
  const { data: myMemberships, error: membershipError } = await supabase
    .from("accountability_circle_members")
    .select("circle_id")
    .eq("user_id", userId)
    .eq("status", "active");
  if (membershipError) throw membershipError;

  const { data: ownedCircles, error: ownedError } = await supabase
    .from("accountability_circles")
    .select("id")
    .eq("creator_id", userId);
  if (ownedError) throw ownedError;

  const circleIds = [
    ...new Set([
      ...(myMemberships ?? []).map((m) => m.circle_id),
      ...(ownedCircles ?? []).map((c) => c.id),
    ]),
  ];
  if (circleIds.length === 0) return [];

  const [{ data: circles, error: circlesError }, { data: memberRows, error: membersError }] =
    await Promise.all([
      supabase.from("accountability_circles").select("*").in("id", circleIds),
      supabase.from("accountability_circle_members").select("*").in("circle_id", circleIds),
    ]);
  if (circlesError) throw circlesError;
  if (membersError) throw membersError;

  const membersByCircle = new Map<string, AccountabilityCircleMemberRow[]>();
  for (const memberRow of memberRows ?? []) {
    const bucket = membersByCircle.get(memberRow.circle_id) ?? [];
    bucket.push(memberRow);
    membersByCircle.set(memberRow.circle_id, bucket);
  }

  const participantIds = [...new Set((memberRows ?? []).map((m) => m.user_id))];
  const { data: users, error: usersError } = participantIds.length
    ? await supabase
        .from("users")
        .select("id, full_name, avatar_url, role")
        .in("id", participantIds)
    : { data: [] as MemberProfileRow[], error: null };
  if (usersError) throw usersError;

  const userMap = new Map((users ?? []).map((user) => [user.id, user]));

  return (circles ?? [])
    .map((circle) => toAccountabilityCircle(circle, membersByCircle, userMap))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
