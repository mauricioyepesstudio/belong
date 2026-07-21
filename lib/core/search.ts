import type { SupabaseServerClient } from "./types";

export type SearchResultType = "person" | "community" | "project" | "organization" | "post" | "mission";

export type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  href: string;
};

function escapeIlike(query: string): string {
  return query.replace(/[%_\\]/g, "\\$&");
}

export async function searchGlobal(
  supabase: SupabaseServerClient,
  userId: string,
  rawQuery: string,
  limit = 24
): Promise<SearchResult[]> {
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  const pattern = `%${escapeIlike(query)}%`;
  const perType = Math.ceil(limit / 6);

  const [
    { data: people },
    { data: communities },
    { data: projects },
    { data: organizations },
    { data: communityPosts },
    { data: projectPosts },
    { data: missions },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, role")
      .neq("id", userId)
      .eq("onboarding_completed", true)
      .ilike("full_name", pattern)
      .limit(perType),
    supabase
      .from("communities")
      .select("id, name, slug, tag")
      .ilike("name", pattern)
      .limit(perType),
    supabase
      .from("projects")
      .select("id, name, status")
      .ilike("name", pattern)
      .limit(perType),
    supabase
      .from("organizations")
      .select("id, name, slug")
      .ilike("name", pattern)
      .limit(perType),
    supabase
      .from("community_posts")
      .select("id, content, community_id")
      .ilike("content", pattern)
      .order("created_at", { ascending: false })
      .limit(perType),
    supabase
      .from("project_posts")
      .select("id, content, project_id")
      .ilike("content", pattern)
      .order("created_at", { ascending: false })
      .limit(perType),
    supabase
      .from("daily_missions")
      .select("id, title, status, mission_date")
      .eq("user_id", userId)
      .ilike("title", pattern)
      .order("mission_date", { ascending: false })
      .limit(perType),
  ]);

  const communityIds = [...new Set((communityPosts ?? []).map((p) => p.community_id))];
  const projectIds = [...new Set((projectPosts ?? []).map((p) => p.project_id))];

  const [{ data: communityMeta }, { data: projectMeta }] = await Promise.all([
    communityIds.length
      ? supabase.from("communities").select("id, slug, name").in("id", communityIds)
      : Promise.resolve({ data: [] as { id: string; slug: string; name: string }[] }),
    projectIds.length
      ? supabase.from("projects").select("id, name").in("id", projectIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const communityMap = new Map((communityMeta ?? []).map((c) => [c.id, c]));
  const projectMap = new Map((projectMeta ?? []).map((p) => [p.id, p]));

  const results: SearchResult[] = [
    ...(people ?? []).map((u) => ({
      id: `person-${u.id}`,
      type: "person" as const,
      title: u.full_name ?? "Builder",
      subtitle: u.role ?? undefined,
      href: `/community?tab=people&q=${encodeURIComponent(u.full_name ?? "")}`,
    })),
    ...(communities ?? []).map((c) => ({
      id: `community-${c.id}`,
      type: "community" as const,
      title: c.name,
      subtitle: c.tag ?? undefined,
      href: `/community/${c.slug}`,
    })),
    ...(projects ?? []).map((p) => ({
      id: `project-${p.id}`,
      type: "project" as const,
      title: p.name,
      subtitle: p.status,
      href: `/projects/${p.id}`,
    })),
    ...(organizations ?? []).map((o) => ({
      id: `organization-${o.id}`,
      type: "organization" as const,
      title: o.name,
      subtitle: "Organization",
      href: `/organizations/${o.slug}`,
    })),
    ...(communityPosts ?? []).map((p) => {
      const community = communityMap.get(p.community_id);
      return {
        id: `cpost-${p.id}`,
        type: "post" as const,
        title: p.content.slice(0, 80) + (p.content.length > 80 ? "…" : ""),
        subtitle: community?.name ?? "Community post",
        href: community ? `/community/${community.slug}?post=${p.id}` : "/community",
      };
    }),
    ...(projectPosts ?? []).map((p) => {
      const project = projectMap.get(p.project_id);
      return {
        id: `ppost-${p.id}`,
        type: "post" as const,
        title: p.content.slice(0, 80) + (p.content.length > 80 ? "…" : ""),
        subtitle: project?.name ?? "Project update",
        href: `/projects/${p.project_id}`,
      };
    }),
    ...(missions ?? []).map((m) => ({
      id: `mission-${m.id}`,
      type: "mission" as const,
      title: m.title,
      subtitle: `${m.status} · ${m.mission_date}`,
      href: `/missions/${m.id}`,
    })),
  ];

  return results.slice(0, limit);
}