import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { ProjectTask } from "@/lib/core/project-workspace";

// Actual handlers, mocked hooks/actions: no DOM or authenticated integration proof.
const harness = vi.hoisted(() => ({
  move: vi.fn(), claim: vi.fn(), toast: vi.fn(), setTasks: vi.fn(), committed: vi.fn(),
  tasks: [] as ProjectTask[], pending: undefined as Promise<void> | undefined,
}));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => typeof initial === "function"
    ? [(initial as () => ProjectTask[])(), harness.setTasks] : [initial, vi.fn()],
  useEffect: vi.fn(), useRef: (initial: unknown) => ({ current: initial }),
  useTransition: () => [false, (work: () => Promise<void>) => { harness.pending = work(); }],
}));
vi.mock("@/lib/actions/project-workspace", () => ({
  createProjectTask: vi.fn(), moveProjectTask: harness.move, updateProjectTask: harness.claim,
}));
vi.mock("@/systems/design-system", () => ({
  Badge: "badge", Button: "button", Card: "card", CardContent: "content",
  EmptyState: "empty", Input: "input", Label: "label", useToast: () => ({ toast: harness.toast }),
}));
import { ProjectTasksTab } from "../components/workspace/tasks-tab";

type Props = { children?: unknown; onClick?: () => void; onChange?: (event: { target: { value: string } }) => void; "aria-label"?: string };
function find(node: unknown, label: string): Props {
  if (Array.isArray(node)) {
    for (const child of node) {
      try { return find(child, label); } catch { /* Continue traversal. */ }
    }
  } else if (node && typeof node === "object" && "props" in node) {
    const props = (node as ReactElement<Props>).props;
    if (props["aria-label"] === label || (Array.isArray(props.children) && props.children.includes(label))) return props;
    return find(props.children, label);
  }
  throw new Error(`Control not found: ${label}`);
}
function render(canApproveWork = true, currentUserName: string | null = "Builder") {
  return ProjectTasksTab({ projectId: "project-1", tasks: harness.tasks, isMember: true,
    currentUserId: "member-1", currentUserName, canApproveWork, onActivityCommitted: harness.committed });
}
function deferred() {
  let resolve!: (result: { error?: string; warning?: string }) => void;
  const promise = new Promise<{ error?: string; warning?: string }>((done) => { resolve = done; });
  return { promise, resolve };
}
beforeEach(() => {
  vi.clearAllMocks(); harness.pending = undefined;
  harness.tasks = [{ id: "task-1", projectId: "project-1", creatorId: "member-1", assigneeId: null,
    title: "Ship prototype", description: null, status: "review", priority: "medium", deadline: null,
    sortOrder: 0, completedAt: null, createdAt: "2026-10-16T12:00:00Z", assigneeName: null, assigneeAvatar: null }];
  harness.setTasks.mockImplementation((update: (tasks: ProjectTask[]) => ProjectTask[]) => { harness.tasks = update(harness.tasks); });
});

describe.each(["approve", "claim"] as const)("task %s confirmation", (operation) => {
  const label = operation === "approve" ? "Approve work" : "Claim task";
  const action = () => operation === "approve" ? harness.move : harness.claim;
  it("keeps saved state pending and on returned error without overwriting other tasks", async () => {
    const save = deferred(); action().mockReturnValue(save.promise);
    find(render(), label).onClick!();
    expect(harness.setTasks).not.toHaveBeenCalled();
    harness.tasks.push({ ...harness.tasks[0], id: "task-2", title: "New independent task", status: "done" });
    const current = harness.tasks;
    save.resolve({ error: "Save rejected" }); await harness.pending;
    expect(harness.tasks).toBe(current);
    expect(harness.setTasks).not.toHaveBeenCalled(); expect(harness.committed).not.toHaveBeenCalled();
    expect(harness.toast).toHaveBeenCalledWith("Save rejected", "error");
  });
  it("patches only confirmed fields preserving current target and unrelated fields", async () => {
    const save = deferred(); action().mockReturnValue(save.promise);
    find(render(), label).onClick!();
    harness.tasks = [{ ...harness.tasks[0], title: "Refreshed title", priority: "urgent" },
      { ...harness.tasks[0], id: "task-2", title: "Independent", status: "in_progress" }];
    const untouched = harness.tasks[1];
    save.resolve({}); await harness.pending;
    expect(harness.tasks[0]).toMatchObject({ title: "Refreshed title", priority: "urgent",
      ...(operation === "approve" ? { status: "done", sortOrder: 0, completedAt: expect.any(String) }
        : { assigneeId: "member-1", assigneeName: "Builder", status: "review" }) });
    expect(harness.tasks[1]).toBe(untouched); expect(harness.committed).toHaveBeenCalledOnce();
    expect(action()).toHaveBeenCalledWith("task-1", ...(operation === "approve" ? ["done", 0] : [{ assigneeId: "member-1" }]));
  });
  it.each(["returned", "thrown"])("releases lock after %s failure and allows retry", async (failure) => {
    if (failure === "returned") action().mockResolvedValueOnce({ error: "Denied" });
    else action().mockRejectedValueOnce(new Error("Offline"));
    const handler = find(render(), label).onClick!;
    handler(); await harness.pending;
    expect(harness.setTasks).not.toHaveBeenCalled(); expect(harness.committed).not.toHaveBeenCalled();
    if (failure === "thrown") expect(harness.toast).toHaveBeenCalledWith(`Task could not be ${operation === "approve" ? "approved" : "claimed"}. Please try again.`, "error");
    action().mockResolvedValueOnce({}); handler(); await harness.pending;
    expect(action()).toHaveBeenCalledTimes(2); expect(harness.committed).toHaveBeenCalledOnce();
  });
  it("suppresses duplicate, move and other operation for the same task until settled", async () => {
    const save = deferred(); action().mockReturnValue(save.promise);
    const tree = render();
    const handler = find(tree, label).onClick!;
    handler(); handler();
    find(tree, operation === "approve" ? "Claim task" : "Approve work").onClick!();
    find(tree, 'Move "Ship prototype" to another column').onChange!({ target: { value: "todo" } });
    expect(harness.move.mock.calls.length + harness.claim.mock.calls.length).toBe(1);
    save.resolve({}); await harness.pending;
  });
});

it("preserves approval warning and activity after confirmed save", async () => {
  harness.move.mockResolvedValue({ warning: "Task saved, progress unavailable" });
  find(render(), "Approve work").onClick!(); await harness.pending;
  expect(harness.toast).toHaveBeenCalledWith("Task saved, progress unavailable", "info");
  expect(harness.committed).toHaveBeenCalledOnce();
});
it("keeps approval unavailable to non-owners", () => {
  expect(() => find(render(false), "Approve work")).toThrow("Control not found");
  expect(harness.move).not.toHaveBeenCalled();
});
it("uses the existing claim name fallback and success message", async () => {
  harness.claim.mockResolvedValue({});
  find(render(true, null), "Claim task").onClick!(); await harness.pending;
  expect(harness.tasks[0].assigneeName).toBe("You");
  expect(harness.toast).toHaveBeenCalledWith("Task claimed", "success");
});
it("a pending move blocks approval and claim on that task", async () => {
  const save = deferred(); harness.move.mockReturnValue(save.promise);
  const tree = render();
  find(tree, 'Move "Ship prototype" to another column').onChange!({ target: { value: "todo" } });
  find(tree, "Approve work").onClick!(); find(tree, "Claim task").onClick!();
  expect(harness.move).toHaveBeenCalledOnce(); expect(harness.claim).not.toHaveBeenCalled();
  save.resolve({}); await harness.pending;
});
it("an unrelated claim survives a later approval failure", async () => {
  harness.tasks[0].assigneeId = "other-member";
  harness.tasks.push({ ...harness.tasks[0], id: "task-2", title: "Independent", status: "todo", assigneeId: null });
  const save = deferred(); harness.move.mockReturnValue(save.promise);
  harness.claim.mockResolvedValue({});
  const tree = render();
  find(tree, "Approve work").onClick!(); const approval = harness.pending;
  find(tree, "Claim task").onClick!(); await harness.pending;
  const claimed = harness.tasks[1];
  expect(claimed.assigneeId).toBe("member-1");
  save.resolve({ error: "Approval rejected" }); await approval;
  expect(harness.tasks[0].status).toBe("review");
  expect(harness.tasks[1]).toBe(claimed);
  expect(harness.committed).toHaveBeenCalledOnce();
});
