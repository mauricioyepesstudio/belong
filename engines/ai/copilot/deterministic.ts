import type { CopilotRunInput, CopilotOutputPayload } from "./types";

function extractActionLines(text: string): string[] {
  return text
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => /^(-|\*|•|\d+\.|TODO|todo:)/i.test(line))
    .map((line) => line.replace(/^(-|\*|•|\d+\.|TODO:?|todo:?)\s*/i, "").trim())
    .filter(Boolean);
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

export function runDeterministicCopilot(input: CopilotRunInput): CopilotOutputPayload {
  const { context, actionType, prompt } = input;
  const discussionText = context.discussions
    .map((d) => `${d.author}: ${d.content}${d.comments.length ? `\nComments: ${d.comments.join("; ")}` : ""}`)
    .join("\n\n");

  switch (actionType) {
    case "summarize_discussions": {
      if (!context.discussions.length) {
        return {
          kind: "summary",
          text: `No discussions yet in ${context.name}. Start a thread to capture momentum and decisions.`,
        };
      }
      const authors = [...new Set(context.discussions.map((d) => d.author))];
      const snippet = truncate(context.discussions[0]?.content ?? "", 160);
      return {
        kind: "summary",
        text: `${context.discussions.length} recent post${context.discussions.length === 1 ? "" : "s"} from ${authors.slice(0, 3).join(", ")}. Latest: "${snippet}"${context.discussions.some((d) => d.comments.length) ? " Follow-up comments indicate active collaboration." : ""}`,
      };
    }
    case "generate_tasks": {
      const fromLines = extractActionLines(discussionText);
      const items =
        fromLines.length > 0
          ? fromLines.slice(0, 5).map((title) => ({ title, priority: "medium" as const }))
          : [
              {
                title: `Review open threads in ${context.name}`,
                description: "Close loops on unanswered questions.",
                priority: "medium" as const,
              },
              {
                title: "Define next deliverable",
                description: "Ship one concrete outcome this week.",
                priority: "high" as const,
              },
            ];
      return { kind: "tasks", items };
    }
    case "generate_milestones": {
      const openTasks = context.tasks.length;
      return {
        kind: "milestones",
        items: [
          {
            title: "Align on scope and owners",
            description: "Confirm priorities with collaborators.",
          },
          {
            title: openTasks > 0 ? "Complete current task batch" : "Launch first work stream",
            description: `${openTasks} tasks tracked in context.`,
          },
          {
            title: "Share progress update",
            description: "Publish a summary for members.",
          },
        ],
      };
    }
    case "suggest_missions": {
      const goal = context.userBuildGoal ?? "growth";
      return {
        kind: "missions",
        items: [
          {
            title: `Contribute to ${context.name}`,
            description: "Take one action that moves the group forward today.",
            rationale: `Aligned with your ${goal} build goal and current context.`,
          },
          {
            title: "Follow up on open discussions",
            description: "Reply to the most recent thread with a clear next step.",
            rationale: "Keeps collaboration momentum high.",
          },
        ],
      };
    }
    case "answer_question": {
      const question = prompt?.trim() || "What should we focus on next?";
      const focus =
        context.tasks.length > 0
          ? `There are ${context.tasks.length} tracked tasks. Prioritize completing in-progress work.`
          : context.discussions.length > 0
            ? "Recent discussions highlight collaboration opportunities — respond and assign owners."
            : `Define the next milestone for ${context.name}.`;
      return {
        kind: "answer",
        text: `${focus} (Question: ${question})`,
      };
    }
    case "create_announcement": {
      return {
        kind: "announcement",
        draft: {
          title: `${context.name} — progress update`,
          body: `Team,\n\nHere's where we stand in ${context.name}:\n• ${context.stats.memberCount ?? "Members"} engaged\n• ${context.discussions.length} recent discussions\n• ${context.tasks.length} active tasks\n\nNext: pick one priority and ship it this week.\n\n— BELONG Copilot`,
        },
      };
    }
    case "weekly_summary": {
      return {
        kind: "weekly_summary",
        data: {
          title: `${context.name} — weekly summary`,
          summary: `This week in ${context.name}: ${context.discussions.length} discussions, ${context.tasks.length} tasks tracked, ${context.milestones.filter((m) => m.completed).length} milestones completed.`,
          highlights: [
            `${context.discussions.length} discussion posts`,
            `${context.tasks.length} tasks in flight`,
            `${context.milestones.length} milestones on roadmap`,
          ],
        },
      };
    }
  }
}
