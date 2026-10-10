import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  insert: vi.fn(),
  member: vi.fn(),
  impact: vi.fn(),
  revalidate: vi.fn(),
  lookup: vi.fn(),
  memberships: [] as Array<{ project_id: string; user_id: string }>,
  lookupError: null as { message: string } | null,
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: mocks.from }) }));
vi.mock("@/lib/auth/session", () => ({ requireProfile: async () => ({ id: "actor-1" }) }));
vi.mock("@/lib/actions/_shared", () => ({
  requireProjectMember: mocks.member,
  revalidateProject: mocks.revalidate,
}));
vi.mock("@/engines/impact/record-action.server", () => ({ recordImpactAction: mocks.impact }));
vi.mock("@/lib/supabase/notify", () => ({ createNotification: vi.fn() }));

import { createProjectTask } from "@/lib/actions/project-workspace";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.member.mockResolvedValue(null);
  mocks.memberships = [{ project_id: "project-1", user_id: "assignee-1" }];
  mocks.lookupError = null;
  mocks.from.mockImplementation((table: string) => {
    const filters: Record<string, string> = {};
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn((column: string, value: string) => {
        filters[column] = value;
        return query;
      }),
      maybeSingle: vi.fn(async () => {
        mocks.lookup({ ...filters });
        const member = mocks.memberships.find((row) =>
          Object.entries(filters).every(([column, value]) => row[column as keyof typeof row] === value)
        );
        return { data: member ? { user_id: member.user_id } : null, error: mocks.lookupError };
      }),
      single: vi.fn(async () => ({ data: { id: "task-1" }, error: null })),
      insert: vi.fn((data: unknown) => {
        mocks.insert(table, data);
        return query;
      }),
      then: (resolve: (value: { count: number; error: null }) => void) => {
        resolve({ count: 2, error: null });
      },
    };
    return query;
  });
});

function expectNoTaskEffects() {
  expect(mocks.from).not.toHaveBeenCalledWith("project_tasks");
  expect(mocks.insert).not.toHaveBeenCalled();
  expect(mocks.impact).not.toHaveBeenCalled();
  expect(mocks.revalidate).not.toHaveBeenCalled();
}

describe("project task creation assignee membership", () => {
  it("rejects an assignee with no membership before any task query or side effect", async () => {
    mocks.memberships = [];
    expect(await createProjectTask("project-1", { title: "Ship prototype", assigneeId: "assignee-1" }))
      .toEqual({ error: "Assignee must be a project member" });
    expectNoTaskEffects();
  });

  it("rejects a user who belongs only to another project", async () => {
    mocks.memberships = [{ project_id: "project-2", user_id: "assignee-1" }];
    expect(await createProjectTask("project-1", { title: "Ship prototype", assigneeId: "assignee-1" }))
      .toEqual({ error: "Assignee must be a project member" });
    expectNoTaskEffects();
  });

  it("rejects a different member of the same project", async () => {
    mocks.memberships = [{ project_id: "project-1", user_id: "someone-else" }];
    expect(await createProjectTask("project-1", { title: "Ship prototype", assigneeId: "assignee-1" }))
      .toEqual({ error: "Assignee must be a project member" });
    expectNoTaskEffects();
  });

  it.each([false, true])("fails closed on a lookup error even with returned membership: %s", async (withData) => {
    if (!withData) mocks.memberships = [];
    mocks.lookupError = { message: "Membership lookup unavailable" };
    expect(await createProjectTask("project-1", { title: "Ship prototype", assigneeId: "assignee-1" }))
      .toEqual({ error: "Membership lookup unavailable" });
    expectNoTaskEffects();
  });

  it("creates a task for the exact project member and then records real work", async () => {
    expect(await createProjectTask("project-1", { title: " Ship prototype ", assigneeId: "assignee-1" }))
      .toEqual({ taskId: "task-1" });
    expect(mocks.lookup).toHaveBeenCalledWith({ project_id: "project-1", user_id: "assignee-1" });
    expect(mocks.member).toHaveBeenCalledWith(expect.anything(), "project-1", "actor-1");
    expect(mocks.insert).toHaveBeenNthCalledWith(1, "project_tasks", expect.objectContaining({
      project_id: "project-1", creator_id: "actor-1", assignee_id: "assignee-1", title: "Ship prototype",
    }));
    expect(mocks.lookup.mock.invocationCallOrder[0]).toBeLessThan(mocks.insert.mock.invocationCallOrder[0]);
    expect(mocks.insert).toHaveBeenNthCalledWith(2, "project_activity", expect.objectContaining({ activity_type: "task_created" }));
    expect(mocks.impact).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ eventType: "project_task_created" }));
    expect(mocks.revalidate).toHaveBeenCalledWith("project-1");
  });

  it.each([undefined, ""])("preserves unassigned creation for assignee %s", async (assigneeId) => {
    expect(await createProjectTask("project-1", { title: "Ship prototype", assigneeId })).toEqual({ taskId: "task-1" });
    expect(mocks.lookup).not.toHaveBeenCalled();
    expect(mocks.insert).toHaveBeenCalledWith("project_tasks", expect.objectContaining({ assignee_id: null }));
    expect(mocks.impact).toHaveBeenCalledTimes(1);
    expect(mocks.revalidate).toHaveBeenCalledWith("project-1");
  });

  it("preserves the actor membership gate before checking an assignee", async () => {
    mocks.member.mockResolvedValue({ error: "You must be a project member" });
    expect(await createProjectTask("project-1", { title: "Ship prototype", assigneeId: "assignee-1" }))
      .toEqual({ error: "You must be a project member" });
    expect(mocks.lookup).not.toHaveBeenCalled();
    expectNoTaskEffects();
  });

  it("preserves title validation before checking an assignee", async () => {
    expect(await createProjectTask("project-1", { title: "   ", assigneeId: "assignee-1" }))
      .toEqual({ error: "Title is required" });
    expect(mocks.lookup).not.toHaveBeenCalled();
    expectNoTaskEffects();
  });
});
