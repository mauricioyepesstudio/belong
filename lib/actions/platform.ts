"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { ensureDefaultOrganization } from "@/lib/core/organizations";
import { createIdentityEngineService, IdentityValidationError } from "@/engines/identity/server";
import { syncUserSkill } from "@/lib/engine/mission-progress";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/types";

export async function uploadAvatar(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { error: "No file provided" };

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const allowed = ["jpg", "jpeg", "png", "webp", "gif"];
  if (!allowed.includes(ext)) return { error: "Invalid file type" };
  if (file.size > 2 * 1024 * 1024) return { error: "File must be under 2MB" };

  const path = `${profile.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const url = `${publicUrl}?t=${Date.now()}`;

  const identity = createIdentityEngineService(supabase);

  try {
    await identity.updateProfile(
      { userId: profile.id },
      { avatarUrl: url }
    );
  } catch (error) {
    if (error instanceof IdentityValidationError) {
      return { error: error.message };
    }
    throw error;
  }

  revalidatePath("/profile");
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { url };
}

export async function updateProfile(data: {
  full_name?: string;
  role?: string;
  location?: string;
  bio?: string;
  build_vision?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const identity = createIdentityEngineService(supabase);

  try {
    await identity.updateProfile(
      { userId: profile.id },
      {
        name: data.full_name,
        role: data.role,
        location: data.location,
        bio: data.bio,
      }
    );
  } catch (error) {
    if (error instanceof IdentityValidationError) {
      return { error: error.message };
    }
    throw error;
  }

  if (data.role !== undefined) {
    await syncUserSkill(supabase, profile.id, data.role);
  }

  if (data.build_vision !== undefined) {
    const { data: mission } = await supabase
      .from("missions")
      .select("id")
      .eq("user_id", profile.id)
      .eq("is_primary", true)
      .maybeSingle();

    if (mission) {
      await supabase
        .from("missions")
        .update({ description: data.build_vision.trim() || null })
        .eq("id", mission.id);
    }
  }

  revalidatePath("/profile");
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return {};
}

export async function updateMission(data: {
  title: string;
  description?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: existing } = await supabase
    .from("missions")
    .select("id")
    .eq("user_id", profile.id)
    .eq("is_primary", true)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("missions")
      .update({
        title: data.title.trim(),
        description: data.description?.trim() || null,
      })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const organizationId = await ensureDefaultOrganization(
      supabase,
      profile.id,
      profile.full_name
    );
    const { error } = await supabase.from("missions").insert({
      user_id: profile.id,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      is_primary: true,
      organization_id: organizationId,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return {};
}
