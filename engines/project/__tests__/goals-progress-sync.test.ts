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
  progressRef: { current: new Set<string>() },
}));

vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useState: (initial: unknown) => Array.isArray(initial)
    ? [initial, harness.setGoals]
    : [initial, vi.fn()],
  useTransition: () => [false, (work: () => Promise<void>) => { harness.pending = work(); }],
  useRef: () => harness.progressRef,
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
  harness.progressRef = { current: new Set<string>() };
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

  it("catches an unconfirmed save without changing goals or exposing the exception", async () => {
    harness.save.mockRejectedValue(new Error("private transport details"));
    const original = harness.goals;
    renderProgressHandler()("goal-1", 75);
    await expect(harness.pending).resolves.toBeUndefined();
    expect(harness.goals).toBe(original);
    expect(harness.setGoals).not.toHaveBeenCalled();
    expect(harness.toast).toHaveBeenCalledWith(
      "Goal progress could not be confirmed. Refresh before trying again.", "error"
    );
    expect(harness.progressRef.current.size).toBe(0);
  });

  it("blocks same-goal duplicates synchronously and across rerenders while pending", async () => {
    let resolveSave!: (result: object) => void;
    harness.save.mockReturnValue(new Promise((resolve) => { resolveSave = resolve; }));
    const handler = renderProgressHandler();
    handler("goal-1", 75);
    handler("goal-1", 75);
    renderProgressHandler()("goal-1", 75);
    expect(harness.save).toHaveBeenCalledTimes(1);
    expect(harness.setGoals).not.toHaveBeenCalled();
    resolveSave({});
    await harness.pending;
    expect(harness.progressRef.current.size).toBe(0);
  });

  it("allows distinct goals to save concurrently without replacing intervening edits", async () => {
    harness.goals.push({ ...harness.goals[0], id: "goal-2", progressPercent: 0 });
    const resolvers = new Map<string, (result: object) => void>();
    harness.save.mockImplementation((id: string) => new Promise((resolve) => { resolvers.set(id, resolve); }));
    const handler = renderProgressHandler();
    handler("goal-1", 75);
    const first = harness.pending;
    handler("goal-2", 0);
    const second = harness.pending;
    expect(harness.save).toHaveBeenCalledTimes(2);
    harness.goals = harness.goals.map((goal) => ({ ...goal, title: `Edited ${goal.id}` }));
    resolvers.get("goal-2")!({});
    await second;
    expect(harness.goals[1]).toMatchObject({ title: "Edited goal-2", progressPercent: 25 });
    resolvers.get("goal-1")!({});
    await first;
    expect(harness.goals[0]).toMatchObject({ title: "Edited goal-1", progressPercent: 100 });
    expect(harness.goals[1]).toMatchObject({ title: "Edited goal-2", progressPercent: 25 });
    expect(harness.progressRef.current.size).toBe(0);
  });

  it("does not roll back target or unrelated edits when a pending save fails", async () => {
    harness.goals.push({ ...harness.goals[0], id: "goal-2", progressPercent: 0 });
    let rejectSave!: (reason: Error) => void;
    harness.save.mockReturnValue(new Promise((_resolve, reject) => { rejectSave = reject; }));
    renderProgressHandler()("goal-1", 75);
    harness.goals = harness.goals.map((goal) => ({ ...goal, title: `Edited ${goal.id}`, progressPercent: 50 }));
    const edited = harness.goals;
    rejectSave(new Error("Network interrupted"));
    await harness.pending;
    expect(harness.goals).toBe(edited);
    expect(harness.setGoals).not.toHaveBeenCalled();
  });

  it.each(["returned error", "rejection", "success"])("releases the goal after %s so a later attempt can run", async (outcome) => {
    if (outcome === "returned error") harness.save.mockResolvedValueOnce({ error: "Goal could not be updated" });
    else if (outcome === "rejection") harness.save.mockRejectedValueOnce(new Error("Interrupted"));
    else harness.save.mockResolvedValueOnce({});
    const handler = renderProgressHandler();
    handler("goal-1", 25);
    await harness.pending;
    expect(harness.progressRef.current.has("goal-1")).toBe(false);
    harness.save.mockResolvedValueOnce({});
    renderProgressHandler()("goal-1", 50);
    await harness.pending;
    expect(harness.save).toHaveBeenCalledTimes(2);
    expect(harness.goals[0]).toMatchObject({ progressPercent: 75, status: "active" });
    expect(harness.progressRef.current.size).toBe(0);
  });
});
