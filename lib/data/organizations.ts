import { createClient } from "@/lib/supabase/server";
import { requireProfile, getCurrentProfile } from "@/lib/auth/session";
import {
  fetchDiscoverOrganizations,
  fetchOrganizationDetail,
  fetchUserOrganizations,
  type OrganizationDetail,
  type DiscoverOrganization,
  type UserOrganization,
} from "@/lib/core/organizations";

export type { OrganizationDetail, DiscoverOrganization, UserOrganization };

export async function getUserOrganizations(limit?: number): Promise<UserOrganization[]> {
  const supabase = await createClient();
  const profile = await requireProfile();
  return fetchUserOrganizations(supabase, profile.id, limit);
}

export async function getDiscoverOrganizations(search?: string): Promise<DiscoverOrganization[]> {
  const supabase = await createClient();
  return fetchDiscoverOrganizations(supabase, { search });
}

export async function getOrganizationDetail(slug: string): Promise<OrganizationDetail | null> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  return fetchOrganizationDetail(supabase, slug, profile?.id ?? null);
}
