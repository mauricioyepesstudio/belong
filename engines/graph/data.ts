import type { SupabaseServerClient } from "@/lib/core/types";
import type { UserProfile } from "@/types/database.types";
import { getBuildGoalOption } from "@/engines/mission/config";
import type { BelongGraphData, GraphEdge, GraphNode } from "@/engines/graph/types";

export async function fetchBelongGraph(
  supabase: SupabaseServerClient,
  userId: string,
  profile: UserProfile
): Promise<BelongGraphData> {
  const centerId = `user:${userId}`;
  const nodes: GraphNode[] = [
    {
      id: centerId,
      type: "user",
      label: profile.full_name ?? "You",
      href: "/profile",
    },
  ];
  const edges: GraphEdge[] = [];

  const goal = getBuildGoalOption(profile.build_goal);
  if (goal) {
    const goalId = `goal:${profile.build_goal}`;
    nodes.push({ id: goalId, type: "goal", label: goal.label });
    edges.push({ source: centerId, target: goalId, label: "building toward" });
  }

  const [
    { data: connections },
    { data: projects },
    { data: memberships },
    { data: events },
    { data: skills },
  ] = await Promise.all([
    supabase
      .from("connections")
      .select("requester_id, recipient_id, status")
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .limit(8),
    supabase
      .from("projects")
      .select("id, name, owner_id")
      .or(`owner_id.eq.${userId}`)
      .limit(6),
    supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", userId)
      .limit(6),
    supabase
      .from("event_registrations")
      .select("event_id")
      .eq("user_id", userId)
      .limit(4),
    supabase.from("user_skills").select("skill").eq("user_id", userId).limit(8),
  ]);

  const communityIds = [...new Set((memberships ?? []).map((m) => m.community_id))];
  const eventIds = [...new Set((events ?? []).map((r) => r.event_id))];

  const [{ data: communities }, { data: eventRows }] = await Promise.all([
    communityIds.length > 0
      ? supabase.from("communities").select("id, name").in("id", communityIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    eventIds.length > 0
      ? supabase.from("events").select("id, title").in("id", eventIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const connectedUserIds = new Set<string>();
  for (const c of connections ?? []) {
    const otherId = c.requester_id === userId ? c.recipient_id : c.requester_id;
    connectedUserIds.add(otherId);
  }

  if (connectedUserIds.size > 0) {
    const { data: people } = await supabase
      .from("users")
      .select("id, full_name, build_goal")
      .in("id", [...connectedUserIds]);

    for (const person of people ?? []) {
      const nodeId = `user:${person.id}`;
      nodes.push({
        id: nodeId,
        type: "user",
        label: person.full_name ?? "Builder",
        href: "/community",
        meta: person.build_goal ?? undefined,
      });
      edges.push({ source: centerId, target: nodeId, label: "connected" });
    }
  }

  for (const p of projects ?? []) {
    const nodeId = `project:${p.id}`;
    nodes.push({
      id: nodeId,
      type: "project",
      label: p.name,
      href: "/projects",
    });
    edges.push({ source: centerId, target: nodeId, label: "building" });
  }

  for (const community of communities ?? []) {
    const nodeId = `community:${community.id}`;
    nodes.push({
      id: nodeId,
      type: "community",
      label: community.name,
      href: "/community",
    });
    edges.push({ source: centerId, target: nodeId, label: "member" });
  }

  for (const event of eventRows ?? []) {
    const nodeId = `event:${event.id}`;
    nodes.push({
      id: nodeId,
      type: "event",
      label: event.title,
      href: "/events",
    });
    edges.push({ source: centerId, target: nodeId, label: "attending" });
  }

  for (const s of skills ?? []) {
    const nodeId = `skill:${s.skill}`;
    if (!nodes.some((n) => n.id === nodeId)) {
      nodes.push({ id: nodeId, type: "skill", label: s.skill });
    }
    edges.push({ source: centerId, target: nodeId, label: "skilled in" });
  }

  if (!skills?.length && profile.role) {
    const nodeId = `skill:${profile.role}`;
    nodes.push({ id: nodeId, type: "skill", label: profile.role });
    edges.push({ source: centerId, target: nodeId, label: "skilled in" });
  }

  return {
    nodes,
    edges,
    centerId,
    stats: {
      people: connectedUserIds.size,
      projects: projects?.length ?? 0,
      communities: communities?.length ?? 0,
      events: eventRows?.length ?? 0,
      skills: skills?.length ?? (profile.role ? 1 : 0),
    },
  };
}
