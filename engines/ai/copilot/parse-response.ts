import type { AICopilotActionType } from "@/types/database.types";
import type { CopilotOutputPayload } from "./types";

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  throw new Error("Invalid AI response shape");
}

function asString(value: unknown, field: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  throw new Error(`Invalid AI response: missing ${field}`);
}

export function parseCopilotResponse(
  actionType: AICopilotActionType,
  raw: string
): CopilotOutputPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("AI response was not valid JSON");
  }

  const obj = asObject(parsed);

  switch (actionType) {
    case "summarize_discussions":
      return { kind: "summary", text: asString(obj.summary, "summary") };
    case "answer_question":
      return { kind: "answer", text: asString(obj.answer, "answer") };
    case "generate_tasks": {
      const tasks = Array.isArray(obj.tasks) ? obj.tasks : [];
      return {
        kind: "tasks",
        items: tasks
          .map((t) => asObject(t))
          .slice(0, 8)
          .map((t) => ({
            title: asString(t.title, "task.title"),
            description: typeof t.description === "string" ? t.description : undefined,
            priority:
              t.priority === "low" ||
              t.priority === "medium" ||
              t.priority === "high" ||
              t.priority === "urgent"
                ? t.priority
                : "medium",
          })),
      };
    }
    case "generate_milestones": {
      const milestones = Array.isArray(obj.milestones) ? obj.milestones : [];
      return {
        kind: "milestones",
        items: milestones
          .map((m) => asObject(m))
          .slice(0, 6)
          .map((m) => ({
            title: asString(m.title, "milestone.title"),
            description: typeof m.description === "string" ? m.description : undefined,
            targetDate: typeof m.targetDate === "string" ? m.targetDate : undefined,
          })),
      };
    }
    case "suggest_missions": {
      const missions = Array.isArray(obj.missions) ? obj.missions : [];
      return {
        kind: "missions",
        items: missions
          .map((m) => asObject(m))
          .slice(0, 5)
          .map((m) => ({
            title: asString(m.title, "mission.title"),
            description: asString(m.description, "mission.description"),
            rationale: asString(m.rationale, "mission.rationale"),
          })),
      };
    }
    case "create_announcement":
      return {
        kind: "announcement",
        draft: {
          title: asString(obj.title, "title"),
          body: asString(obj.body, "body"),
        },
      };
    case "weekly_summary":
      return {
        kind: "weekly_summary",
        data: {
          title: asString(obj.title, "title"),
          summary: asString(obj.summary, "summary"),
          highlights: Array.isArray(obj.highlights)
            ? obj.highlights.filter((h): h is string => typeof h === "string").slice(0, 8)
            : [],
        },
      };
    default:
      throw new Error(`Unsupported action type: ${actionType}`);
  }
}

export function outputPayloadToJson(output: CopilotOutputPayload): Record<string, unknown> {
  switch (output.kind) {
    case "summary":
      return { kind: output.kind, text: output.text };
    case "answer":
      return { kind: output.kind, text: output.text };
    case "tasks":
      return { kind: output.kind, items: output.items };
    case "milestones":
      return { kind: output.kind, items: output.items };
    case "missions":
      return { kind: output.kind, items: output.items };
    case "announcement":
      return { kind: output.kind, draft: output.draft };
    case "weekly_summary":
      return { kind: output.kind, data: output.data };
  }
}
