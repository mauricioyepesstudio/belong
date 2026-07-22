"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { createNotification } from "@/lib/supabase/notify";
import { incrementWeeklyGoalByTitle } from "@/lib/engine/mission-progress";
import { recordImpactAction } from "@/engines/impact/record-action.server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/types";

export async function createEvent(data: {
  title: string;
  description?: string;
  location?: string;
  starts_at: string;
  ends_at?: string;
  community_id?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  if (!data.title.trim()) return { error: "Title is required" };
  if (!data.starts_at) return { error: "Start time is required" };

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      title: data.title.trim(),
      description: data.description?.trim() || null,
      location: data.location?.trim() || null,
      starts_at: data.starts_at,
      ends_at: data.ends_at || null,
      community_id: data.community_id || null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await recordImpactAction(supabase, {
    userId: profile.id,
    module: "event",
    eventType: "event_organized",
    sourceId: event.id,
    metadata: { title: data.title.trim() },
  });

  revalidatePath("/events");
  revalidatePath("/", "layout");
  return { id: event.id };
}

export async function registerForEvent(eventId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { error } = await supabase.from("event_registrations").insert({
    event_id: eventId,
    user_id: profile.id,
  });

  if (error) {
    if (error.code === "23505") return { error: "Already registered" };
    return { error: error.message };
  }

  const { data: event } = await supabase
    .from("events")
    .select("title, created_by")
    .eq("id", eventId)
    .single();

  if (event && event.created_by !== profile.id) {
    await createNotification(supabase, {
      userId: event.created_by,
      title: "New event registration",
      body: `${profile.full_name ?? "Someone"} registered for ${event.title}`,
      type: "event",
      metadata: { event_id: eventId },
    });
  }

  await incrementWeeklyGoalByTitle(supabase, profile.id, "Show up to an event");

  revalidatePath("/events");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return {};
}

export async function unregisterFromEvent(eventId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { error } = await supabase
    .from("event_registrations")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", profile.id);

  if (error) return { error: error.message };

  revalidatePath("/events");
  revalidatePath("/", "layout");
  return {};
}
