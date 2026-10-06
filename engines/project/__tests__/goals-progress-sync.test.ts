import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { ProjectGoal } from "@/lib/core/project-workspace";

// Exercise the tab's event handler with a deferred server action. This checks the
// save/confirmation boundary without adding a DOM renderer to the test stack.
const harness = vi.hoisted(() => ({
  save: vi.fn(),
  toast: vi.fn(),
  setGoals: vi.fn(),
  goals: [] as ProjectGoal[],
  pending: undefined as Promise<void> | undefined,
}));

vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useState: (initial: unknown) => Array.isArray(initial)
    ? [initial, harness.setGoals]
    : [initial, vi.fn()],
  useTransition: () => [false, (work: () => Promise<void>) => { harness.pending = work(); }],
}));
vi.mock("@/lib/actions/project-workspace", () => ({
  createProjectGoal: vi.fn(),
  updateProjectGoalProgress: harness.save,
}));
vi.mock("@/systems/design-system", () => ({
  Badge: "badge", Button: "button", Card: "card", CardContent: "content",
  EmptyState: "empty", Input: "input", Label: "label", ProgressBar: "progress",
  useToast: () => ({ toast: harness.toast }),
}));

import { ProjectGoalsTab } from "../components/workspace/goals-tab";

function findProgressHandler(node: unknown): (id: string, current: number) => void {
  if (Array.isArray(node)) {
    for (const child of node) {
      try { return findProgressHandler(child); } catch { /* try the next child */ }
    }
  } else if (node && typeof node === "object" && "props" in node) {
    const props = (node as ReactElement<{ onBumpProgress?: (id: string, current: number) => void; children?: unknown }>).props;
    if (props.onBumpProgress) return props.onBumpProgress;
    return findProgressHandler(props.children);
  }
  throw new Error("Progress action not found");
}

function renderProgressHandler() {
  return findProgressHandler(ProjectGoalsTab({ projectId: "project-1", goals: harness.goals, isMember: true }));
}

beforeEach(() => {
  vi.clearAllMocks();
  harness.pending = undefined;
  harness.goals = [{
    id: "goal-1", projectId: "project-1", creatorId: "member-1", title: "Ship prototype",
    description: null, goalType: "weekly", progressPercent: 75,
    dueDate: null, status: "active", completedAt: null,
  }];
  harness.setGoals.mockImplementation((update: (goals: ProjectGoal[]) => ProjectGoal[]) => {
    harness.goals = update(harness.goals);
  });
});

describe("goal progress confirmation", () => {
  it("keeps saved progress while pending and on a rejected save", async () => {
    let resolveSave!: (result: { error: string }) => void;
    harness.save.mockReturnValue(new Promise((resolve) => { resolveSave = resolve; }));
    renderProgressHandler()("goal-1", 75);
    expect(harness.save).toHaveBeenCalledWith("goal-1", 100);
    expect(harness.goals[0].progressPercent).toBe(75);
    expect(harness.setGoals).not.toHaveBeenCalled();
    resolveSave({ error: "Goal could not be updated" });
    await harness.pending;
    expect(harness.goals[0]).toMatchObject({ progressPercent: 75, status: "active" });
    expect(harness.setGoals).not.toHaveBeenCalled();
    expect(harness.toast).toHaveBeenCalledWith("Goal could not be updated", "error");
  });

  it("marks the goal complete only after the server confirms the save", async () => {
    harness.save.mockResolvedValue({});
    renderProgressHandler()("goal-1", 75);
    expect(harness.setGoals).not.toHaveBeenCalled();
    await harness.pending;
    expect(harness.goals[0]).toMatchObject({ progressPercent: 100, status: "completed" });
    expect(harness.toast).not.toHaveBeenCalled();
  });

  it("updates only the saved goal and preserves partial progress as active", async () => {
    harness.goals.push({ ...harness.goals[0], id: "goal-2", progressPercent: 0 });
    const untouched = harness.goals[1];
    harness.save.mockResolvedValue({});
    renderProgressHandler()("goal-1", 25);
    await harness.pending;
    expect(harness.goals[0]).toMatchObject({ progressPercent: 50, status: "active" });
    expect(harness.goals[1]).toBe(untouched);
  });
});
