import type { SupabaseServerClient } from "@/lib/core/types";
import type { UserProfile } from "@/types/database.types";
import type { EventWithMeta } from "@/lib/core/events";
import type { Opportunity, ConnectionSuggestion } from "@/engines/ai/coach-types";

export async function detectOpportunities(
  supabase: SupabaseServerClient,
  userId: string,
  stats: {
    pendingConnections: number;
    projects: number;
    communities: number;
  },
  upcomingEvents: EventWithMeta[]
): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = [];

  if (stats.pendingConnections > 0) {
    opportunities.push({
      id: "opp-connections",
      title: "Accept builder connections",
      description: `${stats.pendingConnections} people want to build with you.`,
      actionHref: "/community",
      impactLabel: "+20 impact",
      priority: "high",
    });
  }

  const unregistered = upcomingEvents.filter((e) => !e.registered);
  if (unregistered.length > 0) {
    opportunities.push({
      id: `opp-event-${unregistered[0].id}`,
      title: `Register for ${unregistered[0].title}`,
      description: `${unregistered[0].attendeeCount} builders already attending.`,
      actionHref: "/events",
      impactLabel: "+10 impact",
      priority: "high",
    });
  }

  if (stats.projects === 0) {
    opportunities.push({
      id: "opp-first-project",
      title: "Launch your first project",
      description: "Projects convert vision into visible momentum.",
      actionHref: "/projects",
      impactLabel: "+25 impact",
      priority: "medium",
    });
  }

  if (stats.communities === 0) {
    opportunities.push({
      id: "opp-join-community",
      title: "Find your community",
      description: "Builders with community support ship 3× faster.",
      actionHref: "/community",
      impactLabel: "+20 impact",
      priority: "medium",
    });
  }

  const { data: fundableProjects } = await supabase
    .from("projects")
    .select("id, name, funding_enabled, funding_goal_cents, funding_raised_cents, owner_id")
    .eq("funding_enabled", true)
    .neq("owner_id", userId)
    .limit(1);

  if (fundableProjects?.[0]) {
    const p = fundableProjects[0];
    opportunities.push({
      id: `opp-fund-${p.id}`,
      title: `Back ${p.name}`,
      description: "Support a builder's mission with funding.",
      actionHref: "/projects",
      impactLabel: "High impact",
      priority: "low",
    });
  }

  return opportunities.slice(0, 4);
}

export async function suggestConnections(
  supabase: SupabaseServerClient,
  userId: string,
  profile: UserProfile
): Promise<ConnectionSuggestion[]> {
  let query = supabase
    .from("users")
    .select("id, full_name, avatar_url, build_goal, role")
    .neq("id", userId)
    .eq("onboarding_completed", true)
    .limit(12);

  if (profile.build_goal) {
    query = query.eq("build_goal", profile.build_goal);
  }

  const { data: candidates } = await query;

  const { data: existing } = await supabase
    .from("connections")
    .select("requester_id, recipient_id")
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

  const connected = new Set<string>();
  for (const c of existing ?? []) {
    connected.add(c.requester_id === userId ? c.recipient_id : c.requester_id);
  }

  return (candidates ?? [])
    .filter((c) => !connected.has(c.id))
    .slice(0, 3)
    .map((c) => ({
      id: c.id,
      name: c.full_name ?? "Builder",
      reason: profile.build_goal && c.build_goal === profile.build_goal
        ? `Also building toward ${profile.build_goal.replace(/_/g, " ")}`
        : c.role ?? "Active on BELONG",
      buildGoal: c.build_goal,
      avatarUrl: c.avatar_url,
      actionHref: "/community",
    }));
}
