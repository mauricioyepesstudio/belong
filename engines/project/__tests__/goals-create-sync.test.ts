import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

// Exercise actual tab handlers while retaining refs across simulated rerenders.
// This covers the action boundary, not browser rendering or database persistence.
const harness = vi.hoisted(() => ({
  create: vi.fn(), toast: vi.fn(), setTitle: vi.fn(), setGoals: vi.fn(), reload: vi.fn(),
  title: "  Ship prototype  ", goalType: "quarterly",
  pending: undefined as Promise<void> | undefined,
  creatingRef: { current: false }, progressRef: { current: new Set<string>() },
}));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useState: (initial: unknown) => Array.isArray(initial)
    ? [initial, harness.setGoals]
    : initial === "" ? [harness.title, harness.setTitle] : [harness.goalType, vi.fn()],
  useTransition: () => [false, (work: () => Promise<void>) => { harness.pending = work(); }],
  useRef: (initial: unknown) => initial instanceof Set ? harness.progressRef : harness.creatingRef,
}));
vi.mock("@/lib/actions/project-workspace", () => ({
  createProjectGoal: harness.create, updateProjectGoalProgress: vi.fn(),
}));
vi.mock("@/systems/design-system", () => ({
  Badge: "badge", Button: "button", Card: "card", CardContent: "content",
  EmptyState: "empty", Input: "input", Label: "label", ProgressBar: "progress",
  useToast: () => ({ toast: harness.toast }),
}));
import { ProjectGoalsTab } from "../components/workspace/goals-tab";

function findCreateHandler(node: unknown): () => void {
  if (Array.isArray(node)) {
    for (const child of node) {
      try { return findCreateHandler(child); } catch { /* continue traversal */ }
    }
  } else if (node && typeof node === "object" && "props" in node) {
    const props = (node as ReactElement<{ children?: unknown; onClick?: () => void }>).props;
    if (props.children === "Add goal" && props.onClick) return props.onClick;
    return findCreateHandler(props.children);
  }
  throw new Error("Add goal action not found");
}
function renderCreate() {
  return findCreateHandler(ProjectGoalsTab({ projectId: "project-1", goals: [], isMember: true }));
}
beforeEach(() => {
  vi.clearAllMocks();
  harness.title = "  Ship prototype  ";
  harness.goalType = "quarterly";
  harness.pending = undefined;
  harness.creatingRef = { current: false };
  harness.progressRef = { current: new Set<string>() };
  vi.stubGlobal("window", { location: { reload: harness.reload } });
});
afterEach(() => vi.unstubAllGlobals());

describe("goal creation confirmation", () => {
  it("submits the trimmed draft and selected type, clearing only after existing empty-result success", async () => {
    let resolve!: (result: object) => void;
    harness.create.mockReturnValue(new Promise((done) => { resolve = done; }));
    renderCreate()();
    expect(harness.create).toHaveBeenCalledWith("project-1", { title: "Ship prototype", goalType: "quarterly" });
    expect(harness.setTitle).not.toHaveBeenCalled();
    expect(harness.reload).not.toHaveBeenCalled();
    expect(harness.toast).not.toHaveBeenCalled();
    resolve({});
    await harness.pending;
    expect(harness.setTitle).toHaveBeenCalledWith("");
    expect(harness.reload).toHaveBeenCalledTimes(1);
    expect(harness.toast).toHaveBeenCalledWith("Goal created", "success");
    expect(harness.setGoals).not.toHaveBeenCalled();
  });

  it("preserves the draft and goals on a returned error without claiming success or reloading", async () => {
    harness.create.mockResolvedValue({ error: "Project membership required" });
    renderCreate()();
    await harness.pending;
    expect(harness.toast).toHaveBeenCalledExactlyOnceWith("Project membership required", "error");
    expect(harness.setTitle).not.toHaveBeenCalled();
    expect(harness.setGoals).not.toHaveBeenCalled();
    expect(harness.reload).not.toHaveBeenCalled();
  });

  it("handles rejection without exposing private details, clearing the draft, or reloading", async () => {
    harness.create.mockRejectedValue(new Error("private transport information"));
    renderCreate()();
    await expect(harness.pending).resolves.toBeUndefined();
    expect(harness.toast).toHaveBeenCalledExactlyOnceWith(
      "Goal creation could not be confirmed. Refresh before trying again.", "error"
    );
    expect(harness.setTitle).not.toHaveBeenCalled();
    expect(harness.setGoals).not.toHaveBeenCalled();
    expect(harness.reload).not.toHaveBeenCalled();
  });

  it("blocks duplicate submission before pending renders and across rerenders", async () => {
    let resolve!: (result: object) => void;
    harness.create.mockReturnValue(new Promise((done) => { resolve = done; }));
    const handler = renderCreate();
    handler();
    handler();
    renderCreate()();
    expect(harness.create).toHaveBeenCalledTimes(1);
    resolve({});
    await harness.pending;
  });

  it("ignores whitespace-only drafts", () => {
    harness.title = "   ";
    renderCreate()();
    expect(harness.create).not.toHaveBeenCalled();
    expect(harness.creatingRef.current).toBe(false);
  });

  it.each(["returned error", "rejection", "success"])("releases the guard after %s for a later deliberate attempt", async (outcome) => {
    if (outcome === "returned error") harness.create.mockResolvedValueOnce({ error: "Denied" });
    else if (outcome === "rejection") harness.create.mockRejectedValueOnce(new Error("Interrupted"));
    else harness.create.mockResolvedValueOnce({});
    renderCreate()();
    await harness.pending;
    expect(harness.creatingRef.current).toBe(false);
    harness.create.mockResolvedValueOnce({});
    renderCreate()();
    await harness.pending;
    expect(harness.create).toHaveBeenCalledTimes(2);
    expect(harness.creatingRef.current).toBe(false);
  });
});
