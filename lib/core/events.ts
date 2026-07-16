import type { Event } from "@/types/database.types";
import type { SupabaseServerClient } from "./types";

export type EventWithMeta = Event & { registered: boolean; attendeeCount: number };

export async function attachEventMeta(
  supabase: SupabaseServerClient,
  events: Event[],
  userId: string
): Promise<EventWithMeta[]> {
  if (!events.length) return [];

  const { data: registrations } = await supabase
    .from("event_registrations")
    .select("event_id")
    .eq("user_id", userId);

  const registeredIds = new Set((registrations ?? []).map((r) => r.event_id));

  return Promise.all(
    events.map(async (event) => {
      const { count } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id);

      return {
        ...event,
        registered: registeredIds.has(event.id),
        attendeeCount: count ?? 0,
      };
    })
  );
}

export async function getUpcomingEventsWithMeta(
  supabase: SupabaseServerClient,
  userId: string,
  limit: number,
  options?: { prioritizeRegistered?: boolean }
): Promise<EventWithMeta[]> {
  const now = new Date().toISOString();

  const { data: registrations } = await supabase
    .from("event_registrations")
    .select("event_id")
    .eq("user_id", userId);

  const registeredIds = (registrations ?? []).map((r) => r.event_id);

  if (options?.prioritizeRegistered && registeredIds.length) {
    const [{ data: registeredEvents }, { data: upcomingEvents }] = await Promise.all([
      supabase
        .from("events")
        .select("*")
        .in("id", registeredIds)
        .gte("starts_at", now)
        .order("starts_at", { ascending: true })
        .limit(limit),
      supabase
        .from("events")
        .select("*")
        .gte("starts_at", now)
        .order("starts_at", { ascending: true })
        .limit(limit),
    ]);

    const merged = new Map<string, Event>();
    for (const event of registeredEvents ?? []) merged.set(event.id, event);
    for (const event of upcomingEvents ?? []) {
      if (!merged.has(event.id)) merged.set(event.id, event);
    }

    const events = [...merged.values()]
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
      .slice(0, limit);

    return attachEventMeta(supabase, events, userId);
  }

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .gte("starts_at", now)
    .order("starts_at", { ascending: true })
    .limit(limit);

  return attachEventMeta(supabase, events ?? [], userId);
}
