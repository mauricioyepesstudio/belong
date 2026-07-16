import type { SupabaseServerClient } from "./types";

export type UserStats = {
  connections: number;
  pendingConnections: number;
  projects: number;
  communities: number;
  unreadNotifications: number;
};

export async function fetchUserStats(
  supabase: SupabaseServerClient,
  userId: string
): Promise<UserStats> {
  const [
    { count: connections },
    { count: pendingConnections },
    { data: ownedProjects },
    { data: memberProjects },
    { count: communities },
    { count: unreadNotifications },
  ] = await Promise.all([
    supabase
      .from("connections")
      .select("*", { count: "exact", head: true })
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`),
    supabase
      .from("connections")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("recipient_id", userId),
    supabase.from("projects").select("id").eq("owner_id", userId),
    supabase.from("project_members").select("project_id").eq("user_id", userId),
    supabase
      .from("community_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null),
  ]);

  const projectIds = new Set([
    ...(ownedProjects?.map((p) => p.id) ?? []),
    ...(memberProjects?.map((m) => m.project_id) ?? []),
  ]);

  return {
    connections: connections ?? 0,
    pendingConnections: pendingConnections ?? 0,
    projects: projectIds.size,
    communities: communities ?? 0,
    unreadNotifications: unreadNotifications ?? 0,
  };
}
