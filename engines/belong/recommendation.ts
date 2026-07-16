import type { UserProfile } from "@/types/database.types";
import type { AIInsight } from "@/engines/ai/types";
import type { MissionEngineData } from "@/engines/mission/types";
import type { ImpactEngineData } from "@/engines/impact/types";
import type { Opportunity, ConnectionSuggestion } from "@/engines/ai/coach-types";
import { getBuildGoalOption } from "@/engines/mission/config";

export type CoachRecommendation = {
  title: string;
  description: string;
  why: string;
  actionLabel: string;
  actionHref: string;
};

export function generatePrimaryRecommendation(input: {
  profile: UserProfile;
  stats: {
    connections: number;
    pendingConnections: number;
    projects: number;
    communities: number;
  };
  missionEngine: MissionEngineData;
  impactEngine: ImpactEngineData;
  insights: AIInsight[];
  opportunities: Opportunity[];
  connectionSuggestions: ConnectionSuggestion[];
}): CoachRecommendation {
  const { profile, stats, missionEngine, impactEngine, insights, opportunities, connectionSuggestions } =
    input;
  const goal = getBuildGoalOption(profile.build_goal);
  const goalLabel = goal?.label ?? null;
  const role = profile.role?.trim() || null;

  if (stats.pendingConnections > 0) {
    return {
      title: "Accept builders who align with your mission",
      description: `${stats.pendingConnections} connection request${stats.pendingConnections === 1 ? "" : "s"} waiting. Each relationship expands your ripple.`,
      why: goalLabel
        ? `Your ${goalLabel} goal thrives on trusted collaborators. These builders chose you — accepting strengthens your network for what you're building.`
        : role
          ? `As a ${role}, your impact scales through people. These requests signal builders who see value in connecting with you.`
          : "BELONG works when builders connect with intention. Reviewing these requests keeps your network purposeful, not noisy.",
      actionLabel: "Review connections",
      actionHref: "/community",
    };
  }

  const pendingMission = missionEngine.dailyMissions.find((m) => m.status === "pending");
  if (pendingMission) {
    return {
      title: pendingMission.title,
      description: pendingMission.description ?? "Your highest-impact move today is already defined.",
      why: goalLabel
        ? `This mission was generated for your ${goalLabel} path. Completing it keeps daily action aligned with your long-term vision.`
        : impactEngine.score.level === "Emerging" || impactEngine.score.level === "Starting"
          ? "You're building momentum. This mission is calibrated to your current activity — small consistent steps compound into measurable impact."
          : `At ${impactEngine.score.level} level, focused daily missions maintain the ripple you've already created.`,
      actionLabel: "Start mission",
      actionHref: pendingMission.action_href,
    };
  }

  const highOpp = opportunities.find((o) => o.priority === "high");
  if (highOpp) {
    return {
      title: highOpp.title,
      description: highOpp.description,
      why: goalLabel
        ? `Opportunities like this appear because your profile signals ${goalLabel}. Acting now converts platform activity into real-world progress.`
        : "The coach surfaced this because it matches gaps in your current impact profile — high leverage, low friction.",
      actionLabel: "Take opportunity",
      actionHref: highOpp.actionHref,
    };
  }

  const suggestion = connectionSuggestions[0];
  if (suggestion && stats.connections < 10) {
    return {
      title: `Connect with ${suggestion.name}`,
      description: suggestion.reason,
      why: goalLabel && suggestion.buildGoal === profile.build_goal
        ? `You share the same ${goalLabel} build goal. BELONG prioritizes purpose-aligned connections over volume — this is a high-fit introduction.`
        : role
          ? `Expanding your circle as a ${role} increases the surfaces where your work creates value for others.`
          : "One intentional connection today can unlock collaborations that multiply your impact this week.",
      actionLabel: "View profile",
      actionHref: "/community",
    };
  }

  const topInsight = insights[0];
  if (topInsight) {
    return {
      title: topInsight.title,
      description: topInsight.description,
      why: goalLabel
        ? `Based on your ${goalLabel} focus and current Impact Score (${impactEngine.score.score}), this is the next best step to deepen your contribution.`
        : `Derived from your activity patterns and ${impactEngine.score.level} impact level — designed to move you forward without distraction.`,
      actionLabel: topInsight.actionLabel,
      actionHref: topInsight.actionHref,
    };
  }

  return {
    title: goalLabel ? `Take one step toward ${goalLabel}` : "Define what you're building",
    description: goalLabel
      ? "Your mission is set. Today, choose one action that makes it visible to others."
      : "Clarifying your build goal unlocks personalized missions, communities, and connections.",
    why: profile.bio
      ? `Your profile already tells a story — "${profile.bio.slice(0, 80)}${profile.bio.length > 80 ? "…" : ""}". The next action should make that story actionable.`
      : "BELONG personalizes everything from your stated purpose. A clear goal means every recommendation fits you.",
    actionLabel: goalLabel ? "View profile" : "Complete profile",
    actionHref: goalLabel ? "/profile" : "/settings",
  };
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function personalizedGreeting(firstName: string): string {
  return `Good ${getTimeOfDay()}, ${firstName}.`;
}
