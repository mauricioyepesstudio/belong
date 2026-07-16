import type { AIContext, AIInsight } from "./types";
import { getBuildGoalOption } from "@/engines/mission/config";

function insight(
  id: string,
  title: string,
  description: string,
  actionLabel: string,
  actionHref: string,
  priority: AIInsight["priority"]
): AIInsight {
  return { id, title, description, actionLabel, actionHref, priority };
}

export class BelongAIService {
  generateInsights(context: AIContext): AIInsight[] {
    const insights: AIInsight[] = [];

    if (context.pendingConnections > 0) {
      insights.push(
        insight(
          "pending-connections",
          "Review connection requests",
          `${context.pendingConnections} builder${context.pendingConnections === 1 ? "" : "s"} want to connect with you.`,
          "Review requests",
          "/community",
          "high"
        )
      );
    }

    if (!context.hasMission) {
      insights.push(
        insight(
          "define-mission",
          "Clarify your mission",
          "A clear mission helps BELONG surface the right communities and collaborators.",
          "Define mission",
          "/settings",
          "high"
        )
      );
    }

    if (context.streak === 0 && context.hasMission) {
      insights.push(
        insight(
          "start-streak",
          "Start your momentum streak",
          "Complete a daily mission to begin building consistency.",
          "View missions",
          "/dashboard",
          "high"
        )
      );
    }

    if (context.projects === 0) {
      insights.push(
        insight(
          "start-project",
          "Start your first project",
          "Projects turn intent into momentum. Create one and invite collaborators.",
          "Create project",
          "/projects",
          "medium"
        )
      );
    }

    if (context.communities === 0) {
      insights.push(
        insight(
          "join-community",
          "Find your people",
          "Communities aligned with your build goal accelerate progress.",
          "Explore communities",
          "/community",
          "medium"
        )
      );
    }

    if (context.buildGoal) {
      const goal = getBuildGoalOption(context.buildGoal as Parameters<typeof getBuildGoalOption>[0]);
      if (goal) {
        insights.push(
          insight(
            "build-goal-action",
            `Act on your ${goal.label} goal`,
            `Take one step today aligned with ${goal.label.toLowerCase()}.`,
            "Take action",
            "/profile",
            "medium"
          )
        );
      }
    }

    if (context.unreadMessages > 0) {
      insights.push(
        insight(
          "unread-messages",
          "Reply to conversations",
          `You have ${context.unreadMessages} unread message${context.unreadMessages === 1 ? "" : "s"}.`,
          "Open messages",
          "/messages",
          "medium"
        )
      );
    }

    if (context.impactLevel === "Emerging" || context.impactLevel === "Starting") {
      insights.push(
        insight(
          "grow-impact",
          "Grow your impact score",
          "Complete daily missions and connect with builders to level up.",
          "View impact",
          "/profile",
          "low"
        )
      );
    }

    if (context.unreadNotifications > 0) {
      insights.push(
        insight(
          "unread-notifications",
          "Catch up on activity",
          `${context.unreadNotifications} notification${context.unreadNotifications === 1 ? "" : "s"} waiting.`,
          "View notifications",
          "/notifications",
          "low"
        )
      );
    }

    return insights.slice(0, 5);
  }
}

export const aiService = new BelongAIService();
