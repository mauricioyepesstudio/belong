import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { ProjectTask } from "@/lib/core/project-workspace";

// Exercise the real handler; mocked hooks/actions are not browser or integration proof.
const harness = vi.hoisted(() => ({
  create: vi.fn(), toast: vi.fn(), setTasks: vi.fn(), setTitle: vi.fn(),
  tasks: [] as ProjectTask[], title: "  Build prototype  ", pending: undefined as Promise<void> | undefined,
}));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => typeof initial === "function"
    ? [(initial as () => ProjectTask[])(), harness.setTasks]
    : initial === "" ? [harness.title, harness.setTitle] : [initial, vi.fn()],
  useEffect: vi.fn(), useRef: (initial: unknown) => ({ current: initial }),
  useTransition: () => [false, (work: () => Promise<void>) => { harness.pending = work(); }],
}));
vi.mock("@/lib/actions/project-workspace", () => ({
  createProjectTask: harness.create, moveProjectTask: vi.fn(), updateProjectTask: vi.fn(),
}));
vi.mock("@/systems/design-system", () => ({
  Badge: "badge", Button: "button", Card: "card", CardContent: "content",
  EmptyState: "empty", Input: "input", Label: "label", useToast: () => ({ toast: harness.toast }),
}));
import { ProjectTasksTab } from "../components/workspace/tasks-tab";

type Props = { children?: unknown; onClick?: () => void };
function findCreate(node: unknown): () => void {
  if (Array.isArray(node)) {
    for (const child of node) {
      try { return findCreate(child); } catch { /* Continue traversal. */ }
    }
  } else if (node && typeof node === "object" && "props" in node) {
    const props = (node as ReactElement<Props>).props;
    if (Array.isArray(props.children) && props.children.includes("Add task")) return props.onClick!;
    return findCreate(props.children);
  }
  throw new Error("Create control not found");
}
function render() {
  return findCreate(ProjectTasksTab({ projectId: "project-1", tasks: harness.tasks, isMember: true,
    currentUserId: "member-1", currentUserName: "Builder", canApproveWork: true }));
}
type Result = { error?: string; taskId?: string };
function deferred() {
  let resolve!: (result: Result) => void;
  const promise = new Promise<Result>((done) => { resolve = done; });
  return { promise, resolve };
}
function task(id = "existing"): ProjectTask {
  return { id, projectId: "project-1", creatorId: "member-1", assigneeId: null,
    title: "Existing task", description: null, status: "todo", priority: "medium", deadline: null,
    sortOrder: 0, completedAt: null, createdAt: "2026-10-17T12:00:00Z", assigneeName: null, assigneeAvatar: null };
}
const unconfirmed = "Task creation could not be confirmed. Refresh the board before trying again.";
beforeEach(() => {
  vi.clearAllMocks(); harness.pending = undefined; harness.title = "  Build prototype  "; harness.tasks = [task()];
  harness.setTasks.mockImplementation((update: (tasks: ProjectTask[]) => ProjectTask[]) => { harness.tasks = update(harness.tasks); });
});

describe("task creation confirmation", () => {
  it("retains draft and current tasks pending and on returned error", async () => {
    const save = deferred(); harness.create.mockReturnValue(save.promise);
    render()();
    expect(harness.setTitle).not.toHaveBeenCalled(); expect(harness.setTasks).not.toHaveBeenCalled();
    harness.tasks.push(task("independent")); const current = harness.tasks;
    save.resolve({ error: "Not authorized" }); await harness.pending;
    expect(harness.tasks).toBe(current); expect(harness.setTitle).not.toHaveBeenCalled();
    expect(harness.setTasks).not.toHaveBeenCalled();
    expect(harness.toast).toHaveBeenCalledWith("Not authorized", "error");
  });
  it("catches rejected actions without claiming nothing was inserted", async () => {
    harness.create.mockRejectedValueOnce(new Error("Post-insert activity failed"));
    const current = harness.tasks; render()();
    await expect(harness.pending).resolves.toBeUndefined();
    expect(harness.tasks).toBe(current); expect(harness.setTasks).not.toHaveBeenCalled();
    expect(harness.setTitle).not.toHaveBeenCalled();
    expect(harness.toast).toHaveBeenCalledWith(unconfirmed, "error");
  });
  it.each([undefined, "", "   "])("does not report success without a confirmed ID (%s)", async (taskId) => {
    harness.create.mockResolvedValueOnce({ taskId }); render()(); await harness.pending;
    expect(harness.setTitle).not.toHaveBeenCalled(); expect(harness.setTasks).not.toHaveBeenCalled();
    expect(harness.toast).toHaveBeenCalledWith(unconfirmed, "error");
    expect(harness.toast).not.toHaveBeenCalledWith("Task created", "success");
  });
  it.each(["returned", "thrown", "missing-id"])("unlocks retry after %s failure", async (failure) => {
    if (failure === "thrown") harness.create.mockRejectedValueOnce(new Error("Offline"));
    else harness.create.mockResolvedValueOnce(failure === "returned" ? { error: "Denied" } : {});
    const handler = render(); handler(); await harness.pending;
    harness.create.mockResolvedValueOnce({ taskId: "new-task" }); handler(); await harness.pending;
    expect(harness.create).toHaveBeenCalledTimes(2);
    expect(harness.tasks.filter((item) => item.id === "new-task")).toHaveLength(1);
    expect(harness.setTitle).toHaveBeenCalledExactlyOnceWith("");
  });
  it("guards duplicate calls until confirmed, trims title, and appends one saved ID", async () => {
    const save = deferred(); harness.create.mockReturnValue(save.promise);
    const handler = render(); handler(); handler();
    expect(harness.create).toHaveBeenCalledExactlyOnceWith("project-1", { title: "Build prototype" });
    save.resolve({ taskId: "new-task" }); await harness.pending;
    expect(harness.tasks).toHaveLength(2);
    expect(harness.tasks[1]).toMatchObject({ id: "new-task", title: "Build prototype", status: "todo", sortOrder: 1 });
    expect(harness.setTitle).toHaveBeenCalledExactlyOnceWith("");
    expect(harness.toast).toHaveBeenCalledWith("Task created", "success");
  });
  it("preserves a refreshed saved task without appending a duplicate", async () => {
    const save = deferred(); harness.create.mockReturnValue(save.promise); render()();
    const refreshed = { ...task("new-task"), title: "Server title", priority: "urgent" as const };
    harness.tasks = [...harness.tasks, refreshed]; const current = harness.tasks;
    save.resolve({ taskId: "new-task" }); await harness.pending;
    expect(harness.tasks).toBe(current); expect(harness.tasks[1]).toBe(refreshed);
    expect(harness.tasks.filter((item) => item.id === "new-task")).toHaveLength(1);
  });
  it("does not submit a blank draft", () => {
    harness.title = "   "; render()(); expect(harness.create).not.toHaveBeenCalled();
  });
});
