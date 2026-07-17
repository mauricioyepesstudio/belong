import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, requireProfile } from "@/lib/auth/session";
import { fetchProjectDetail, fetchDiscoverProjectsInCommunities, getAllProjectsForUser } from "@/lib/core";

export type {
  ProjectWithMemberCount,
  ProjectDetail,
  ProjectMember,
  ProjectPostWithMeta,
  ProjectCommentWithAuthor,
  ProjectCommunitySummary,
} from "@/lib/core";

export async function getUserProjects() {
  const supabase = await createClient();
  const profile = await requireProfile();
  return getAllProjectsForUser(supabase, profile.id);
}

export async function getDiscoverProjects() {
  const supabase = await createClient();
  const profile = await requireProfile();
  return fetchDiscoverProjectsInCommunities(supabase, profile.id);
}

export async function getProjectDetail(projectId: string) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  return fetchProjectDetail(supabase, projectId, profile?.id ?? null);
}
