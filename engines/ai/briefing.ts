import type { AIInsight } from "./types";
import type { DailyMission } from "@/engines/mission/types";
import type { ImpactScore } from "@/engines/impact/calculate";
import type { ConnectionSuggestion, Opportunity } from "./coach-types";

export type { Opportunity, ConnectionSuggestion, TopImpactAction } from "./coach-types";

export type CoachContext = {
  firstName: string;
  buildGoal: string | null;
  impact: ImpactScore;
  streak: number;
  dailyCompleted: number;
  dailyTotal: number;
  pendingConnections: number;
  pendingMissions: DailyMission[];
  opportunities: Opportunity[];
  connectionSuggestions: ConnectionSuggestion[];
  insights: AIInsight[];
};

export type DailyBriefing = {
  greeting: string;
  summary: string;
  focus: string;
  opportunities: Opportunity[];
  connectionSuggestions: ConnectionSuggestion[];
};

export function generateDailyBriefing(ctx: CoachContext): DailyBriefing {
  const parts: string[] = [];

  if (ctx.streak > 1) {
    parts.push(`You are on a ${ctx.streak}-day momentum streak.`);
  } else if (ctx.streak === 1) {
    parts.push("You started a new momentum streak today.");
  }

  parts.push(
    `Your Impact Score is ${ctx.impact.score} (${ctx.impact.level}).` +
      (ctx.dailyTotal > 0
        ? ` ${ctx.dailyCompleted} of ${ctx.dailyTotal} daily missions complete.`
        : "")
  );

  if (ctx.pendingConnections > 0) {
    parts.push(
      `${ctx.pendingConnections} connection request${ctx.pendingConnections === 1 ? "" : "s"} await your response.`
    );
  }

  if (ctx.buildGoal) {
    parts.push(`Your north star is ${ctx.buildGoal.replace(/_/g, " ")} — stay aligned.`);
  }

  const topInsight = ctx.insights[0];
  const focus = topInsight
    ? topInsight.title
    : ctx.pendingMissions[0]?.title ?? "Complete your daily missions";

  return {
    greeting: `Good ${getTimeOfDay()}, ${ctx.firstName}.`,
    summary: parts.join(" "),
    focus,
    opportunities: ctx.opportunities,
    connectionSuggestions: ctx.connectionSuggestions,
  };
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
