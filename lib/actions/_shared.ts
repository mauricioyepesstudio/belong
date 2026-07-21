import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/types";
import type { createClient } from "@/lib/supabase/server";

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export function authorFromProfile(profile: {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}) {
  return {
    id: profile.id,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
  };
}

export function revalidateCommunity(slug?: string) {
  revalidatePath("/community");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  if (slug) revalidatePath(`/community/${slug}`);
}

export function revalidateProject(projectId?: string) {
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

export function revalidateOrganization(slug?: string) {
  revalidatePath("/organizations");
  revalidatePath("/dashboard");
  revalidatePath("/community");
  revalidatePath("/projects");
  revalidatePath("/", "layout");
  if (slug) revalidatePath(`/organizations/${slug}`);
}

export async function requireCommunityMembership(
  supabase: SupabaseServerClient,
  communityId: string,
  userId: string,
  message = "You must be a member to perform this action"
): Promise<ActionResult | null> {
  const { data } = await supabase
    .from("community_members")
    .select("id")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return { error: message };
  return null;
}

export async function requireProjectMembership(
  supabase: SupabaseServerClient,
  projectId: string,
  userId: string
): Promise<ActionResult | null> {
  const { data: project } = await supabase
    .from("projects")
    .select("community_id")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) return { error: "Project not found" };

  const communityError = await requireCommunityMembership(
    supabase,
    project.community_id,
    userId,
    "You must be a community member to participate in this project"
  );
  if (communityError) return communityError;

  const { data: member } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!member) return { error: "You must be a project member to perform this action" };
  return null;
}

export async function requireProjectMember(
  supabase: SupabaseServerClient,
  projectId: string,
  userId: string
): Promise<ActionResult | null> {
  const { data } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return { error: "You must be a project member" };
  return null;
}
