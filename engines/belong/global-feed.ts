import type { SupabaseServerClient } from "@/lib/core/types";

export type LiveImpactActivity = {
  id: string;
  userName: string;
  communityName: string;
  contributionType: string;
  points: number;
  createdAt: string;
};

export type TrendingMission = {
  title: string;
  completions: number;
};

export type ActiveCommunity = {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  tag: string | null;
};

export type SuccessStory = {
  id: string;
  type: "goal" | "project";
  title: string;
  userName: string;
  completedAt: string;
  href: string;
};

export type GlobalImpactFeed = {
  liveActivity: LiveImpactActivity[];
  trendingMissions: TrendingMission[];
  activeCommunities: ActiveCommunity[];
  successStories: SuccessStory[];
};

export type UserActivityItem = {
  id: string;
  type: "contribution" | "mission" | "goal" | "project" | "community" | "connection" | "event";
  title: string;
  subtitle?: string;
  points?: number;
  href: string;
  createdAt: string;
};

export async function fetchUserRecentActivity(
  supabase: SupabaseServerClient,
  userId: string,
  limit = 12
): Promise<UserActivityItem[]> {
  const [
    { data: contributions },
    { data: completedMissions },
    { data: completedGoals },
    { data: projects },
    { data: memberships },
    { data: connections },
    { data: registrations },
  ] = await Promise.all([
    supabase
      .from("community_contributions")
      .select("id, contribution_type, points, created_at, community_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("daily_missions")
      .select("id, title, impact_points, completed_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(limit),
    supabase
      .from("weekly_goals")
      .select("id, title, impact_points, completed_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(limit),
    supabase
      .from("projects")
      .select("id, name, status, created_at, updated_at")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("community_members")
      .select("id, community_id, joined_at, role")
      .eq("user_id", userId)
      .order("joined_at", { ascending: false })
      .limit(limit),
    supabase
      .from("connections")
      .select("id, requester_id, recipient_id, status, updated_at")
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("event_registrations")
      .select("event_id, registered_at")
      .eq("user_id", userId)
      .order("registered_at", { ascending: false })
      .limit(limit),
  ]);

  const communityIds = new Set<string>();
  for (const c of contributions ?? []) communityIds.add(c.community_id);
  for (const m of memberships ?? []) communityIds.add(m.community_id);

  const eventIds = [...new Set((registrations ?? []).map((r) => r.event_id))];
  const connectionUserIds = new Set<string>();
  for (const c of connections ?? []) {
    connectionUserIds.add(c.requester_id === userId ? c.recipient_id : c.requester_id);
  }

  const [{ data: communities }, { data: events }, { data: users }] = await Promise.all([
    communityIds.size
      ? supabase.from("communities").select("id, name, slug").in("id", [...communityIds])
      : Promise.resolve({ data: [] as { id: string; name: string; slug: string }[] }),
    eventIds.length
      ? supabase.from("events").select("id, title").in("id", eventIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    connectionUserIds.size
      ? supabase.from("users").select("id, full_name").in("id", [...connectionUserIds])
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
  ]);

  const communityMap = new Map((communities ?? []).map((c) => [c.id, c]));
  const eventMap = new Map((events ?? []).map((e) => [e.id, e.title]));
  const userMap = new Map((users ?? []).map((u) => [u.id, u.full_name ?? "Builder"]));

  const items: UserActivityItem[] = [
    ...(contributions ?? []).map((c) => ({
      id: `contrib-${c.id}`,
      type: "contribution" as const,
      title: c.contribution_type.replace(/_/g, " "),
      subtitle: communityMap.get(c.community_id)?.name,
      points: c.points,
      href: communityMap.get(c.community_id)?.slug
        ? `/community/${communityMap.get(c.community_id)!.slug}`
        : "/community",
      createdAt: c.created_at,
    })),
    ...(completedMissions ?? []).map((m) => ({
      id: `mission-${m.id}`,
      type: "mission" as const,
      title: m.title,
      subtitle: "Daily mission completed",
      points: m.impact_points,
      href: `/missions/${m.id}`,
      createdAt: m.completed_at!,
    })),
    ...(completedGoals ?? []).map((g) => ({
      id: `goal-${g.id}`,
      type: "goal" as const,
      title: g.title,
      subtitle: "Weekly goal completed",
      points: g.impact_points,
      href: "/dashboard",
      createdAt: g.completed_at!,
    })),
    ...(projects ?? []).map((p) => ({
      id: `project-${p.id}`,
      type: "project" as const,
      title: p.name,
      subtitle: `Project ${p.status}`,
      href: `/projects/${p.id}`,
      createdAt: p.created_at,
    })),
    ...(memberships ?? []).map((m) => ({
      id: `community-${m.id}`,
      type: "community" as const,
      title: `Joined ${communityMap.get(m.community_id)?.name ?? "community"}`,
      subtitle: m.role,
      href: `/community/${communityMap.get(m.community_id)?.slug ?? ""}`,
      createdAt: m.joined_at,
    })),
    ...(connections ?? []).map((c) => {
      const otherId = c.requester_id === userId ? c.recipient_id : c.requester_id;
      return {
        id: `connection-${c.id}`,
        type: "connection" as const,
        title: `Connected with ${userMap.get(otherId) ?? "builder"}`,
        subtitle: "New connection",
        href: "/community",
        createdAt: c.updated_at,
      };
    }),
    ...(registrations ?? []).map((r) => ({
      id: `event-${r.event_id}`,
      type: "event" as const,
      title: `Registered for ${eventMap.get(r.event_id) ?? "event"}`,
      subtitle: "Event registration",
      href: "/events",
      createdAt: r.registered_at,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  return items;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export async function fetchGlobalImpactFeed(
  supabase: SupabaseServerClient
): Promise<GlobalImpactFeed> {
  const weekStart = daysAgo(7);

  const [
    { data: contributions },
    { data: completedMissions },
    { data: memberships },
    { data: completedGoals },
    { data: completedProjects },
  ] = await Promise.all([
    supabase
      .from("community_contributions")
      .select("id, user_id, community_id, contribution_type, points, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("daily_missions")
      .select("title")
      .eq("status", "completed")
      .gte("mission_date", weekStart),
    supabase.from("community_members").select("community_id"),
    supabase
      .from("weekly_goals")
      .select("id, user_id, title, completed_at")
      .eq("status", "completed")
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(5),
    supabase
      .from("projects")
      .select("id, name, owner_id, updated_at")
      .eq("status", "completed")
      .order("updated_at", { ascending: false })
      .limit(4),
  ]);

  const userIds = new Set<string>();
  const communityIds = new Set<string>();

  for (const c of contributions ?? []) {
    userIds.add(c.user_id);
    communityIds.add(c.community_id);
  }
  for (const g of completedGoals ?? []) userIds.add(g.user_id);
  for (const p of completedProjects ?? []) userIds.add(p.owner_id);

  const memberCommunityIds = [...new Set((memberships ?? []).map((m) => m.community_id))];
  for (const id of memberCommunityIds) communityIds.add(id);

  const [{ data: users }, { data: communities }] = await Promise.all([
    userIds.size
      ? supabase.from("users").select("id, full_name").in("id", [...userIds])
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    communityIds.size
      ? supabase.from("communities").select("id, name, slug, tag").in("id", [...communityIds])
      : Promise.resolve({ data: [] as { id: string; name: string; slug: string; tag: string | null }[] }),
  ]);

  const userMap = new Map((users ?? []).map((u) => [u.id, u.full_name ?? "Builder"]));
  const communityMap = new Map((communities ?? []).map((c) => [c.id, c]));

  const liveActivity: LiveImpactActivity[] = (contributions ?? []).map((c) => ({
    id: c.id,
    userName: userMap.get(c.user_id) ?? "Builder",
    communityName: communityMap.get(c.community_id)?.name ?? "Community",
    contributionType: c.contribution_type.replace(/_/g, " "),
    points: c.points,
    createdAt: c.created_at,
  }));

  const missionCounts = new Map<string, number>();
  for (const m of completedMissions ?? []) {
    missionCounts.set(m.title, (missionCounts.get(m.title) ?? 0) + 1);
  }
  const trendingMissions: TrendingMission[] = [...missionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([title, completions]) => ({ title, completions }));

  const memberCounts = new Map<string, number>();
  for (const m of memberships ?? []) {
    memberCounts.set(m.community_id, (memberCounts.get(m.community_id) ?? 0) + 1);
  }

  const topCommunityIds = [...memberCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id]) => id);

  let activeCommunityRows: { id: string; name: string; slug: string; tag: string | null }[] = [];
  if (topCommunityIds.length) {
    const { data } = await supabase
      .from("communities")
      .select("id, name, slug, tag")
      .in("id", topCommunityIds);
    activeCommunityRows = data ?? [];
  }

  const activeCommunityMap = new Map(activeCommunityRows.map((c) => [c.id, c]));

  const activeCommunities: ActiveCommunity[] = topCommunityIds.map((id) => {
    const c = activeCommunityMap.get(id);
    return {
      id,
      name: c?.name ?? "Community",
      slug: c?.slug ?? id,
      memberCount: memberCounts.get(id) ?? 0,
      tag: c?.tag ?? null,
    };
  });

  const successStories: SuccessStory[] = [
    ...(completedGoals ?? []).map((g) => ({
      id: g.id,
      type: "goal" as const,
      title: g.title,
      userName: userMap.get(g.user_id) ?? "Builder",
      completedAt: g.completed_at!,
      href: "/dashboard",
    })),
    ...(completedProjects ?? []).map((p) => ({
      id: p.id,
      type: "project" as const,
      title: p.name,
      userName: userMap.get(p.owner_id) ?? "Builder",
      completedAt: p.updated_at,
      href: `/projects/${p.id}`,
    })),
  ]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 6);

  return {
    liveActivity,
    trendingMissions,
    activeCommunities,
    successStories,
  };
}
