import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { getAllProjectsForUser } from "@/lib/core";

export type { ProjectWithMemberCount } from "@/lib/core";

export async function getUserProjects() {
  const supabase = await createClient();
  const profile = await requireProfile();
  return getAllProjectsForUser(supabase, profile.id);
}
