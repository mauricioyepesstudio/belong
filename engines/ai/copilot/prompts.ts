import type { AICopilotActionType } from "@/types/database.types";
import type { CopilotContextPayload } from "./types";

const BASE_SYSTEM = `You are BELONG AI Copilot — a purposeful assistant inside the BELONG Life Operating System.
You help builders summarize discussions, plan work, align missions, and communicate clearly.
Always respond with valid JSON only. Be concise, actionable, and grounded in the provided context.
Never invent facts not supported by the context.`;

const OUTPUT_SCHEMAS: Record<AICopilotActionType, string> = {
  summarize_discussions:
    '{"summary":"string — 2-4 sentences capturing themes and open questions"}',
  generate_tasks:
    '{"tasks":[{"title":"string","description":"string","priority":"low|medium|high|urgent"}]}',
  generate_milestones:
    '{"milestones":[{"title":"string","description":"string","targetDate":"YYYY-MM-DD or empty"}]}',
  suggest_missions:
    '{"missions":[{"title":"string","description":"string","rationale":"string"}]}',
  answer_question: '{"answer":"string — direct answer using context"}',
  create_announcement: '{"title":"string","body":"string — announcement copy"}',
  weekly_summary:
    '{"title":"string","summary":"string","highlights":["string","string"]}',
};

export function buildCopilotSystemPrompt(actionType: AICopilotActionType): string {
  return `${BASE_SYSTEM}\n\nRespond with JSON matching: ${OUTPUT_SCHEMAS[actionType]}`;
}

export function buildCopilotUserPrompt(
  context: CopilotContextPayload,
  actionType: AICopilotActionType,
  prompt?: string
): string {
  const contextJson = JSON.stringify(
    {
      contextType: context.type,
      name: context.name,
      description: context.description,
      user: {
        name: context.userName,
        buildGoal: context.userBuildGoal,
        missionTitle: context.userMissionTitle,
        impactLevel: context.userImpactLevel,
      },
      stats: context.stats,
      discussions: context.discussions.slice(0, 25),
      tasks: context.tasks.slice(0, 30),
      milestones: context.milestones.slice(0, 15),
    },
    null,
    2
  );

  const actionInstructions: Record<AICopilotActionType, string> = {
    summarize_discussions: "Summarize the recent discussions. Note key decisions and unanswered questions.",
    generate_tasks: "Propose 3-5 concrete tasks based on discussions and current project state.",
    generate_milestones: "Propose 2-4 milestones that move this work forward over the next 4-8 weeks.",
    suggest_missions:
      "Suggest 2-3 daily or weekly mission ideas aligned with the user's build goal and this context.",
    answer_question: `Answer this question using only the context: ${prompt?.trim() || "What should we focus on next?"}`,
    create_announcement:
      "Draft a clear announcement for members about recent progress and next steps.",
    weekly_summary:
      "Produce a weekly summary with title, narrative summary, and 3-5 bullet highlights.",
  };

  return `${actionInstructions[actionType]}\n\nContext:\n${contextJson}`;
}
