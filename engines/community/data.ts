import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, requireProfile } from "@/lib/auth/session";
import {
  fetchCommunityDetail,
  fetchDiscoverCommunities,
  joinMembershipsWithCommunities,
} from "@/lib/core";

export type {
  UserCommunity,
  DiscoverCommunity,
  CommunityDetail,
  CommunityMember,
  CommunityPostWithMeta,
  CommunityCommentWithAuthor,
} from "@/lib/core";

export async function getUserCommunities() {
  const supabase = await createClient();
  const profile = await requireProfile();
  return joinMembershipsWithCommunities(supabase, profile.id);
}

export async function getDiscoverCommunities(search?: string) {
  const supabase = await createClient();
  return fetchDiscoverCommunities(supabase, { search });
}

export const getCommunityDetail = cache(async (slug: string) => {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  return fetchCommunityDetail(supabase, slug, profile?.id ?? null);
});

export async function searchCommunities(query: string) {
  const supabase = await createClient();
  return fetchDiscoverCommunities(supabase, { search: query, limit: 24 });
}
