import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { resolveConnectionState } from "@/lib/core/connection-state";
import { fetchGlobalSocialFeed, fetchProfileSocialFeed } from "./data";
import type {
  SocialProfilePage,
  SocialPublishingContext,
} from "./types";

type PageOptions = { cursor?: string | null; limit?: number };

async function publishingContexts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<SocialPublishingContext[]> {
  const [{ data: memberships }, { data: projectMemberships }] = await Promise.all([
    supabase.from("community_members").select("community_id").eq("user_id", userId),
    supabase.from("project_members").select("project_id").eq("user_id", userId),
  ]);
  const communityIds = (memberships ?? []).map((row) => row.community_id);
  const projectIds = (projectMemberships ?? []).map((row) => row.project_id);
  const [{ data: communities }, { data: projects }] = await Promise.all([
    communityIds.length
      ? supabase.from("communities").select("id, name").in("id", communityIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    projectIds.length
      ? supabase.from("projects").select("id, name").in("id", projectIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);
  return [
    ...(communities ?? []).map((row) => ({ type: "community" as const, ...row })),
    ...(projects ?? []).map((row) => ({ type: "project" as const, ...row })),
  ].sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}

export async function getGlobalSocialFeed(options: PageOptions = {}) {
  const supabase = await createClient();
  const viewer = await requireProfile();
  const [page, contexts] = await Promise.all([
    fetchGlobalSocialFeed(supabase, viewer.id, options),
    publishingContexts(supabase, viewer.id),
  ]);
  return {
    page,
    viewer: {
      id: viewer.id,
      fullName: viewer.full_name,
      avatarUrl: viewer.avatar_url,
    },
    publishingContexts: contexts,
  };
}

export async function getSocialProfilePage(
  options: PageOptions & { userId: string }
): Promise<SocialProfilePage | null> {
  const supabase = await createClient();
  const viewer = await requireProfile();
  const { data: profile } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, role, bio, location, build_goal")
    .eq("id", options.userId)
    .maybeSingle();
  if (!profile) return null;

  const [
    posts,
    { data: identity },
    { data: skills },
    { data: projectMemberships },
    { data: communityMemberships },
    { data: connectionRows },
    { data: impactRows },
    { count: connectionCount },
    { count: postCount },
    { data: authoredPostIds },
  ] = await Promise.all([
    fetchProfileSocialFeed(supabase, profile.id, viewer.id, options),
    supabase.from("identity_profiles").select("interests").eq("user_id", profile.id).maybeSingle(),
    supabase.from("user_skills").select("skill").eq("user_id", profile.id),
    supabase.from("project_members").select("project_id").eq("user_id", profile.id),
    supabase.from("community_members").select("community_id, role").eq("user_id", profile.id),
    supabase
      .from("connections")
      .select("id, requester_id, recipient_id, status")
      .or(`and(requester_id.eq.${viewer.id},recipient_id.eq.${profile.id}),and(requester_id.eq.${profile.id},recipient_id.eq.${viewer.id})`),
    supabase
      .from("impact_events")
      .select("id, event_type, points, metadata, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("connections")
      .select("id", { count: "exact", head: true })
      .eq("status", "accepted")
      .or(`requester_id.eq.${profile.id},recipient_id.eq.${profile.id}`),
    supabase
      .from("social_posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", profile.id),
    supabase.from("social_posts").select("id").eq("author_id", profile.id),
  ]);

  const projectIds = (projectMemberships ?? []).map((row) => row.project_id);
  const communityIds = (communityMemberships ?? []).map((row) => row.community_id);
  const [{ data: projects }, { data: communities }, supportResult, contexts] = await Promise.all([
    projectIds.length
      ? supabase.from("projects").select("id, name, status").in("id", projectIds)
      : Promise.resolve({ data: [] as { id: string; name: string; status: string | null }[] }),
    communityIds.length
      ? supabase.from("communities").select("id, name, slug").in("id", communityIds)
      : Promise.resolve({ data: [] as { id: string; name: string; slug: string }[] }),
    authoredPostIds?.length
      ? supabase
          .from("social_post_reactions")
          .select("id", { count: "exact", head: true })
          .in("post_id", authoredPostIds.map((row) => row.id))
      : Promise.resolve({ count: 0 }),
    publishingContexts(supabase, viewer.id),
  ]);
  const communityRoleMap = new Map(
    (communityMemberships ?? []).map((row) => [row.community_id, row.role])
  );
  const impact = (impactRows ?? []).map((row) => ({
    id: row.id,
    title: row.event_type.replace(/_/g, " "),
    description:
      typeof row.metadata === "object" && row.metadata && !Array.isArray(row.metadata)
        ? (row.metadata.description as string | undefined) ?? null
        : null,
    points: row.points,
  }));
  const resolvedConnection = resolveConnectionState(viewer.id, connectionRows ?? []);
  const connectionState: SocialProfilePage["connectionState"] =
    viewer.id === profile.id
      ? "self"
      : resolvedConnection.state === "pending-sent"
        ? "pending_sent"
        : resolvedConnection.state === "pending-received"
          ? "pending_received"
          : resolvedConnection.state;

  return {
    profile: {
      id: profile.id,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
      headline: profile.role,
      bio: profile.bio,
      location: profile.location,
      buildGoal: profile.build_goal,
      interests: identity?.interests ?? [],
      skills: (skills ?? []).map((row) => row.skill),
    },
    viewer: {
      id: viewer.id,
      fullName: viewer.full_name,
      avatarUrl: viewer.avatar_url,
    },
    isSelf: viewer.id === profile.id,
    connectionState,
    connectionId: resolvedConnection.id,
    posts,
    publishingContexts: contexts,
    projects: projects ?? [],
    communities: (communities ?? []).map((row) => ({
      ...row,
      role: communityRoleMap.get(row.id) ?? null,
    })),
    impact,
    stats: {
      connectionCount: connectionCount ?? 0,
      projectCount: projects?.length ?? 0,
      communityCount: communities?.length ?? 0,
      impactScore: impact.reduce((sum, item) => sum + item.points, 0),
      postCount: postCount ?? 0,
      supportCount: supportResult.count ?? 0,
    },
  };
}

export async function getOwnSocialProfilePage(
  options: PageOptions = {}
): Promise<SocialProfilePage> {
  const viewer = await requireProfile();
  const page = await getSocialProfilePage({ ...options, userId: viewer.id });
  if (!page) throw new Error("Profile not found");
  return page;
}
