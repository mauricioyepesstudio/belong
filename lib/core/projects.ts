import type { Project } from "@/types/database.types";
import type { SupabaseServerClient } from "./types";

export type ProjectWithMemberCount = Project & { memberCount: number };

export async function attachProjectMemberCounts(
  supabase: SupabaseServerClient,
  projects: Project[]
): Promise<ProjectWithMemberCount[]> {
  if (!projects.length) return [];

  return Promise.all(
    projects.map(async (project) => {
      const { count } = await supabase
        .from("project_members")
        .select("*", { count: "exact", head: true })
        .eq("project_id", project.id);
      return { ...project, memberCount: count ?? 1 };
    })
  );
}

export async function getUniqueProjectIds(
  supabase: SupabaseServerClient,
  userId: string
): Promise<Set<string>> {
  const [{ data: owned }, { data: memberships }] = await Promise.all([
    supabase.from("projects").select("id").eq("owner_id", userId),
    supabase.from("project_members").select("project_id").eq("user_id", userId),
  ]);

  return new Set([
    ...(owned?.map((p) => p.id) ?? []),
    ...(memberships?.map((m) => m.project_id) ?? []),
  ]);
}

export async function getAllProjectsForUser(
  supabase: SupabaseServerClient,
  userId: string
): Promise<ProjectWithMemberCount[]> {
  const [{ data: owned }, { data: memberships }] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false }),
    supabase.from("project_members").select("project_id").eq("user_id", userId),
  ]);

  const ownedIds = new Set((owned ?? []).map((p) => p.id));
  const memberIds = (memberships ?? [])
    .map((m) => m.project_id)
    .filter((id) => !ownedIds.has(id));

  let memberProjects: Project[] = [];
  if (memberIds.length) {
    const { data } = await supabase.from("projects").select("*").in("id", memberIds);
    memberProjects = data ?? [];
  }

  const combined = [...(owned ?? []), ...memberProjects].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  return attachProjectMemberCounts(supabase, combined);
}

export async function getActiveProjectsForUser(
  supabase: SupabaseServerClient,
  userId: string,
  limit?: number
): Promise<ProjectWithMemberCount[]> {
  const [{ data: owned }, { data: memberships }] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false }),
    supabase.from("project_members").select("project_id").eq("user_id", userId),
  ]);

  const ownedIds = new Set((owned ?? []).map((p) => p.id));
  const memberIds = (memberships ?? [])
    .map((m) => m.project_id)
    .filter((id) => !ownedIds.has(id));

  let memberProjects: Project[] = [];
  if (memberIds.length) {
    const { data } = await supabase.from("projects").select("*").in("id", memberIds);
    memberProjects = data ?? [];
  }

  const combined = [...(owned ?? []), ...memberProjects]
    .filter((p) => p.status === "active" || p.status === "planning")
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const sliced = limit ? combined.slice(0, limit) : combined;
  return attachProjectMemberCounts(supabase, sliced);
}
