import { describe, expect, it } from "vitest";
import { runDeterministicCopilot } from "@/engines/ai/copilot/deterministic";
import { parseCopilotResponse } from "@/engines/ai/copilot/parse-response";
import type { CopilotContextPayload } from "@/engines/ai/copilot/types";

const baseContext: CopilotContextPayload = {
  type: "project",
  id: "proj-1",
  name: "Test Project",
  description: "Building something meaningful",
  userId: "user-1",
  userName: "Builder",
  userBuildGoal: "startup",
  userMissionTitle: "Launch MVP",
  userImpactLevel: "Emerging",
  discussions: [
    {
      author: "Alex",
      content: "We should ship the onboarding flow this week.",
      createdAt: new Date().toISOString(),
      comments: ["Agreed — I'll take the first pass."],
    },
  ],
  tasks: [{ title: "Draft onboarding", priority: "high" }],
  milestones: [{ title: "Beta launch", completed: false, targetDate: null }],
  stats: { progress: 40, memberCount: 3 },
};

describe("BelongCopilot deterministic engine", () => {
  it("summarizes discussions from context", () => {
    const result = runDeterministicCopilot({
      context: baseContext,
      actionType: "summarize_discussions",
    });
    expect(result.kind).toBe("summary");
    if (result.kind === "summary") {
      expect(result.text).toContain("Alex");
      expect(result.text.length).toBeGreaterThan(20);
    }
  });

  it("generates tasks from discussion lines", () => {
    const result = runDeterministicCopilot({
      context: {
        ...baseContext,
        discussions: [
          {
            author: "Alex",
            content: "TODO: Write API docs\n- Fix login bug",
            createdAt: new Date().toISOString(),
            comments: [],
          },
        ],
      },
      actionType: "generate_tasks",
    });
    expect(result.kind).toBe("tasks");
    if (result.kind === "tasks") {
      expect(result.items.length).toBeGreaterThan(0);
    }
  });

  it("parses LLM JSON for milestones", () => {
    const parsed = parseCopilotResponse(
      "generate_milestones",
      JSON.stringify({
        milestones: [{ title: "Ship v1", description: "First release", targetDate: "2026-08-01" }],
      })
    );
    expect(parsed.kind).toBe("milestones");
    if (parsed.kind === "milestones") {
      expect(parsed.items[0]?.title).toBe("Ship v1");
    }
  });

  it("answers questions with context-aware focus", () => {
    const result = runDeterministicCopilot({
      context: baseContext,
      actionType: "answer_question",
      prompt: "What is blocking us?",
    });
    expect(result.kind).toBe("answer");
    if (result.kind === "answer") {
      expect(result.text).toContain("What is blocking us?");
    }
  });
});
