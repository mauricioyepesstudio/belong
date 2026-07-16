import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { attachEventMeta, getUpcomingEventsWithMeta } from "@/lib/core";

export type { EventWithMeta } from "@/lib/core";

export async function getUpcomingEvents() {
  const supabase = await createClient();
  const profile = await requireProfile();
  return getUpcomingEventsWithMeta(supabase, profile.id, 24);
}

export async function getPastEvents() {
  const supabase = await createClient();
  const profile = await requireProfile();
  const now = new Date().toISOString();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .lt("starts_at", now)
    .order("starts_at", { ascending: false })
    .limit(24);

  if (!events?.length) return [];

  return attachEventMeta(supabase, events, profile.id);
}
