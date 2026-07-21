"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile, getCurrentProfile } from "@/lib/auth/session";
import { createNotification, slugify } from "@/lib/supabase/notify";
import type { ActionResult } from "@/lib/actions/types";
import type { OrganizationDetail } from "@/lib/core/organizations";
import type { OrganizationMemberRole } from "@/types/database.types";
import type { Database } from "@/types/database.types";
import {
  canAdminOrganization,
  canManageOrganization,
  canWriteOrganization,
  ensureDefaultOrganization,
  fetchOrganizationDetail,
  fetchOrganizationMembership,
} from "@/lib/core/organizations";
import { recordImpactEvent } from "@/engines/identity/reputation";
import { revalidateOrganization } from "@/lib/actions/_shared";

export async function refreshOrganizationDetail(slug: string): Promise<OrganizationDetail | null> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  return fetchOrganizationDetail(supabase, slug, profile?.id ?? null);
}

async function requireOrganizationMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  userId: string,
  minRole?: OrganizationMemberRole[]
): Promise<ActionResult | null> {
  const membership = await fetchOrganizationMembership(supabase, organizationId, userId);
  if (!membership) return { error: "You must be an organization member" };
  if (minRole?.length && !minRole.includes(membership.role)) {
    return { error: "Not authorized" };
  }
  return null;
}

export async function createOrganization(data: {
  name: string;
  description?: string;
  website?: string;
}): Promise<ActionResult & { slug?: string }> {
  const supabase = await createClient();
  const profile = await requireProfile();

  if (!data.name.trim()) return { error: "Name is required" };

  const { data: organization, error } = await supabase
    .from("organizations")
    .insert({
      name: data.name.trim(),
      slug: slugify(data.name),
      description: data.description?.trim() || null,
      website: data.website?.trim() || null,
      owner_id: profile.id,
    })
    .select("id, slug")
    .single();

  if (error) return { error: error.message };

  const { error: memberError } = await supabase.from("organization_members").insert({
    organization_id: organization.id,
    user_id: profile.id,
    role: "owner",
  });

  if (memberError) {
    await supabase.from("organizations").delete().eq("id", organization.id);
    return { error: memberError.message };
  }

  await recordImpactEvent(supabase, {
    userId: profile.id,
    module: "organization",
    eventType: "organization_created",
    points: 20,
    sourceId: organization.id,
    metadata: { organization_name: data.name.trim() },
  });

  revalidateOrganization(organization.slug);
  return { slug: organization.slug };
}

export async function joinOrganization(organizationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: organization } = await supabase
    .from("organizations")
    .select("name, owner_id, slug")
    .eq("id", organizationId)
    .single();

  if (!organization) return { error: "Organization not found" };

  const { error } = await supabase.from("organization_members").insert({
    organization_id: organizationId,
    user_id: profile.id,
    role: "member",
  });

  if (error) {
    if (error.code === "23505") return { error: "Already a member" };
    return { error: error.message };
  }

  await recordImpactEvent(supabase, {
    userId: profile.id,
    module: "organization",
    eventType: "organization_join",
    points: 10,
    sourceId: organizationId,
    metadata: { organization_name: organization.name },
  });

  if (organization.owner_id !== profile.id) {
    await createNotification(supabase, {
      userId: organization.owner_id,
      title: "New organization member",
      body: `${profile.full_name ?? "Someone"} joined ${organization.name}`,
      type: "system",
      metadata: { organization_id: organizationId },
    });
  }

  revalidateOrganization(organization.slug);
  return {};
}

export async function leaveOrganization(organizationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const membership = await fetchOrganizationMembership(supabase, organizationId, profile.id);
  if (!membership) return { error: "Not a member" };
  if (membership.role === "owner") {
    return { error: "Owners cannot leave. Transfer ownership or delete the organization." };
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", organizationId)
    .single();

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("user_id", profile.id);

  if (error) return { error: error.message };

  revalidateOrganization(organization?.slug);
  return {};
}

export async function inviteToOrganization(
  organizationId: string,
  userId: string,
  role: OrganizationMemberRole = "member"
): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const authError = await requireOrganizationMembership(
    supabase,
    organizationId,
    profile.id,
    ["owner", "admin", "manager"]
  );
  if (authError) return authError;

  if (role === "owner") return { error: "Cannot assign owner role via invite" };

  const { data: organization } = await supabase
    .from("organizations")
    .select("name, slug")
    .eq("id", organizationId)
    .single();

  if (!organization) return { error: "Organization not found" };

  const { error } = await supabase.from("organization_members").insert({
    organization_id: organizationId,
    user_id: userId,
    role,
  });

  if (error) {
    if (error.code === "23505") return { error: "Already a member" };
    return { error: error.message };
  }

  await createNotification(supabase, {
    userId,
    title: "Organization invitation",
    body: `You were added to ${organization.name}`,
    type: "system",
    metadata: { organization_id: organizationId },
  });

  await recordImpactEvent(supabase, {
    userId,
    module: "organization",
    eventType: "organization_invite_accepted",
    points: 8,
    sourceId: organizationId,
    metadata: { invited_by: profile.id },
  });

  revalidateOrganization(organization.slug);
  return {};
}

export async function updateOrganizationMemberRole(
  organizationId: string,
  userId: string,
  role: OrganizationMemberRole
): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const authError = await requireOrganizationMembership(
    supabase,
    organizationId,
    profile.id,
    ["owner", "admin"]
  );
  if (authError) return authError;

  if (role === "owner" && profile.id !== userId) {
    const { data: org } = await supabase
      .from("organizations")
      .select("owner_id, slug")
      .eq("id", organizationId)
      .single();

    if (org?.owner_id !== profile.id) {
      return { error: "Only the owner can transfer ownership" };
    }

    await supabase
      .from("organizations")
      .update({ owner_id: userId })
      .eq("id", organizationId);
  }

  if (role === "owner") {
    await supabase
      .from("organization_members")
      .update({ role: "admin" })
      .eq("organization_id", organizationId)
      .eq("user_id", profile.id);
  }

  const { error } = await supabase
    .from("organization_members")
    .update({ role: role === "owner" ? "owner" : role })
    .eq("organization_id", organizationId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  const { data: org } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", organizationId)
    .single();

  revalidateOrganization(org?.slug);
  return {};
}

export async function updateOrganizationSettings(
  organizationId: string,
  data: {
    name?: string;
    description?: string | null;
    website?: string | null;
    logoUrl?: string | null;
  }
): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const membership = await fetchOrganizationMembership(supabase, organizationId, profile.id);
  if (!canAdminOrganization(membership?.role)) {
    return { error: "Not authorized" };
  }

  const updates: Database["public"]["Tables"]["organizations"]["Update"] = {};
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.description !== undefined) updates.description = data.description?.trim() || null;
  if (data.website !== undefined) updates.website = data.website?.trim() || null;
  if (data.logoUrl !== undefined) updates.logo_url = data.logoUrl?.trim() || null;

  const { data: org, error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", organizationId)
    .select("slug")
    .single();

  if (error) return { error: error.message };

  revalidateOrganization(org.slug);
  return {};
}

export { ensureDefaultOrganization, canWriteOrganization, canManageOrganization, canAdminOrganization };
