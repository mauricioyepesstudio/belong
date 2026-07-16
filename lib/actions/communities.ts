"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { createNotification, slugify } from "@/lib/supabase/notify";
import { createCommunitySubscriptionCheckout } from "@/lib/actions/billing";
import { logCommunityContribution } from "@/lib/engine/mission-progress";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/types";

export async function createCommunity(data: {
  name: string;
  description?: string;
  tag?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  if (!data.name.trim()) return { error: "Name is required" };

  const { data: community, error } = await supabase
    .from("communities")
    .insert({
      name: data.name.trim(),
      slug: slugify(data.name),
      description: data.description?.trim() || null,
      tag: data.tag?.trim() || null,
      owner_id: profile.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("community_members").insert({
    community_id: community.id,
    user_id: profile.id,
    role: "owner",
  });

  revalidatePath("/community");
  revalidatePath("/", "layout");
  return { id: community.id };
}

export async function joinCommunity(communityId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: community } = await supabase
    .from("communities")
    .select("is_paid, name, owner_id")
    .eq("id", communityId)
    .single();

  if (!community) return { error: "Community not found" };

  if (community.is_paid) {
    return createCommunitySubscriptionCheckout(communityId);
  }

  const { error } = await supabase.from("community_members").insert({
    community_id: communityId,
    user_id: profile.id,
    role: "member",
  });

  if (error) {
    if (error.code === "23505") return { error: "Already a member" };
    return { error: error.message };
  }

  if (community.owner_id !== profile.id) {
    await createNotification(supabase, {
      userId: community.owner_id,
      title: "New community member",
      body: `${profile.full_name ?? "Someone"} joined ${community.name}`,
      type: "community",
      metadata: { community_id: communityId },
    });
  }

  await logCommunityContribution(supabase, profile.id, communityId, "join");

  revalidatePath("/community");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return {};
}

export async function leaveCommunity(communityId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", profile.id);

  if (error) return { error: error.message };

  revalidatePath("/community");
  revalidatePath("/", "layout");
  return {};
}
