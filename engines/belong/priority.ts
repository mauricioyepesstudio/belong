import type { AIInsight } from "@/engines/ai/types";
import type { DailyMission } from "@/engines/mission/types";
import type { Opportunity } from "@/engines/ai/coach-types";
import type { TopImpactAction } from "@/engines/ai/coach-types";

export function resolveTopImpactAction(input: {
  pendingConnections: number;
  pendingMissions: DailyMission[];
  opportunities: Opportunity[];
  insights: AIInsight[];
  unreadMessages: number;
}): TopImpactAction {
  if (input.pendingConnections > 0) {
    return {
      title: "Review connection requests",
      description: `${input.pendingConnections} builder${input.pendingConnections === 1 ? "" : "s"} want to connect. Relationships multiply impact.`,
      actionHref: "/community",
      actionLabel: "Review now",
      impactPoints: 20,
      source: "connection",
    };
  }

  const nextMission = input.pendingMissions.find((m) => m.status === "pending");
  if (nextMission) {
    return {
      title: nextMission.title,
      description: nextMission.description ?? "Complete today's highest-priority mission.",
      actionHref: nextMission.action_href,
      actionLabel: "Complete mission",
      impactPoints: nextMission.impact_points,
      source: "mission",
    };
  }

  const highOpp = input.opportunities.find((o) => o.priority === "high");
  if (highOpp) {
    return {
      title: highOpp.title,
      description: highOpp.description,
      actionHref: highOpp.actionHref,
      actionLabel: "Take action",
      impactPoints: 15,
      source: "opportunity",
    };
  }

  if (input.unreadMessages > 0) {
    return {
      title: "Reply to conversations",
      description: `${input.unreadMessages} unread message${input.unreadMessages === 1 ? "" : "s"}. Human connection drives belonging.`,
      actionHref: "/messages",
      actionLabel: "Open messages",
      impactPoints: 12,
      source: "message",
    };
  }

  const topInsight = input.insights[0];
  if (topInsight) {
    return {
      title: topInsight.title,
      description: topInsight.description,
      actionHref: topInsight.actionHref,
      actionLabel: topInsight.actionLabel,
      impactPoints: 10,
      source: "coach",
    };
  }

  return {
    title: "Explore your BELONG graph",
    description: "Discover how your people, projects, and communities connect.",
    actionHref: "/community",
    actionLabel: "Explore",
    impactPoints: 10,
    source: "coach",
  };
}
