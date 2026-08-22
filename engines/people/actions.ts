"use server";

import { createClient } from "@/lib/supabase/server";
import { fetchProfileSocialFeed } from "@/engines/social/data";
import { requireProfile } from "@/lib/auth/session";

export async function getPersonStories(userId: string) {
  const supabase = await createClient();
  const viewer = await requireProfile();
  // Fetch posts for the person
  const feed = await fetchProfileSocialFeed(supabase, userId, viewer.id, { limit: 10 });
  return feed.posts;
}
