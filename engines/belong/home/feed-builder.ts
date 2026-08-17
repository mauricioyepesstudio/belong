import type { HomeEngineData } from "@/engines/belong/data";
import type { UserActivityItem } from "@/engines/belong/global-feed";
import type { Opportunity } from "@/engines/ai/coach-types";
import type { EventWithMeta } from "@/lib/core/events";
import type { HomeActivity, HomeActivityType, PublishIntention } from "./types";

const INTENTION_ROTATION: PublishIntention[] = [
  "inspire",
  "ask",
  "teach",
  "collaborate",
  "build",
  "celebrate",
  "support",
];

function activityTypeFromLegacy(type: UserActivityItem["type"]): HomeActivityType {
  switch (type) {
    case "post":
    case "comment":
      return "post";
    case "project":
      return "project";
    case "event":
      return "event";
    case "connection":
      return "collaboration_request";
    case "community":
    case "contribution":
    case "member":
      return "community";
    case "mission":
    case "goal":
    case "achievement":
      return "achievement";
    default:
      return "post";
  }
}

function mapLegacyActivity(item: UserActivityItem, index: number): HomeActivity {
  const type = activityTypeFromLegacy(item.type);
  const parts = item.subtitle?.split(" in ") ?? [];
  const authorName = parts[0]?.replace(/ commented$/, "") ?? "Builder";

  return {
    id: item.id,
    type,
    intention: INTENTION_ROTATION[index % INTENTION_ROTATION.length],
    title: item.title,
    body: item.subtitle,
    author: {
      id: `legacy-${item.id}`,
      name: authorName,
      avatarUrl: null,
    },
    href: item.href,
    createdAt: item.createdAt,
    contextLabel: parts[1] ?? item.subtitle,
    imageUrl: item.imageUrl ?? undefined,
    reactions: {},
    commentCount: 0,
    impactPoints: item.points,
  };
}

function buildEventActivities(events: EventWithMeta[]): HomeActivity[] {
  return events.map((event) => ({
    id: `event-${event.id}`,
    type: "event" as const,
    intention: "collaborate" as const,
    title: event.title,
    body: event.description ?? undefined,
    excerpt: event.location ?? undefined,
    author: {
      id: "belong-events",
      name: "BELONG Events",
      avatarUrl: null,
    },
    href: "/events",
    createdAt: event.starts_at,
    contextLabel: event.registered ? "You're registered" : "Upcoming event",
    meta: { attendees: event.attendeeCount },
    reactions: {},
    commentCount: event.attendeeCount,
  }));
}

function buildIdeaActivities(opportunities: Opportunity[]): HomeActivity[] {
  return opportunities.map((opp) => ({
    id: `idea-${opp.id}`,
    type: "idea" as const,
    intention: "build" as const,
    title: opp.title,
    body: opp.description,
    author: {
      id: "belong-coach",
      name: "BELONG Coach",
      avatarUrl: null,
      role: "Opportunity",
    },
    href: opp.actionHref,
    createdAt: new Date().toISOString(),
    contextLabel: opp.impactLabel,
    reactions: {},
    commentCount: 0,
  }));
}

function buildProjectActivities(data: {
  recentProjects: HomeEngineData["recentProjects"];
}): HomeActivity[] {
  return data.recentProjects.slice(0, 3).map((project) => ({
    id: `home-project-${project.id}`,
    type: "project" as const,
    intention: "build" as const,
    title: project.name,
    body: project.description ?? undefined,
    author: {
      id: project.owner_id,
      name: "Project team",
      avatarUrl: null,
    },
    href: `/projects/${project.id}`,
    createdAt: project.updated_at,
    contextLabel: `${project.status} · ${project.memberCount} members`,
    meta: { progress: project.progress },
    reactions: {},
    commentCount: project.memberCount,
  }));
}

function buildCommunityActivities(data: {
  timeline: HomeEngineData["timeline"];
  communities: HomeEngineData["communities"];
}): HomeActivity[] {
  const items: HomeActivity[] = [];

  if (data.timeline.communityPulse) {
    const pulse = data.timeline.communityPulse;
    items.push({
      id: "community-pulse",
      type: "post",
      intention: "inspire",
      title: pulse.title,
      author: {
        id: "community",
        name: pulse.communityName,
        avatarUrl: null,
      },
      href: pulse.href,
      createdAt: pulse.createdAt,
      contextLabel: "Trending in your community",
      reactions: {},
      commentCount: 2,
    });
  }

  for (const community of data.communities.slice(0, 2)) {
    items.push({
      id: `community-${community.id}`,
      type: "community",
      intention: "celebrate",
      title: `${community.name} is growing`,
      body: community.description ?? undefined,
      author: {
        id: community.id,
        name: community.name,
        avatarUrl: null,
      },
      href: `/community/${community.slug}`,
      createdAt: community.joinedAt,
      contextLabel: `${community.memberCount} members`,
      reactions: {},
      commentCount: 0,
    });
  }

  return items;
}

function buildCollaborationActivities(data: {
  connectionSuggestions: HomeEngineData["connectionSuggestions"];
}): HomeActivity[] {
  return data.connectionSuggestions.slice(0, 2).map((s) => ({
    id: `collab-${s.id}`,
    type: "collaboration_request" as const,
    intention: "collaborate" as const,
    title: `Collaborate with ${s.name}`,
    body: s.reason,
    author: {
      id: s.id,
      name: s.name,
      avatarUrl: s.avatarUrl,
      role: s.buildGoal,
    },
    href: s.actionHref,
    createdAt: new Date().toISOString(),
    contextLabel: "Open collaboration request",
    reactions: {},
    commentCount: 0,
  }));
}

export function buildHomeTimeline(input: {
  recentActivity: HomeEngineData["recentActivity"];
  primaryRecommendation: HomeEngineData["primaryRecommendation"];
  connectionSuggestions: HomeEngineData["connectionSuggestions"];
  recentProjects: HomeEngineData["recentProjects"];
  timeline: HomeEngineData["timeline"];
  communities: HomeEngineData["communities"];
  upcomingEvents: EventWithMeta[];
  opportunities: Opportunity[];
}): HomeActivity[] {
  const legacy = input.recentActivity.map(mapLegacyActivity);

  if (legacy.length === 0 && input.communities.length === 0) {
    return [];
  }

  const dataSlice = {
    primaryRecommendation: input.primaryRecommendation,
    connectionSuggestions: input.connectionSuggestions,
    recentProjects: input.recentProjects,
    timeline: input.timeline,
    communities: input.communities,
  };

  const suggested: HomeActivity[] =
    input.communities.length > 0
      ? [
          ...buildCollaborationActivities(dataSlice).slice(0, 1),
          ...buildIdeaActivities(input.opportunities.slice(0, 1)),
          ...buildEventActivities(input.upcomingEvents.slice(0, 1)),
          ...buildProjectActivities(dataSlice).slice(0, 1),
          ...buildCommunityActivities(dataSlice).slice(0, 1),
        ]
      : [];

  return [...legacy, ...suggested]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 24);
}
