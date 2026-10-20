import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  maybeSingle: vi.fn(),
  profile: vi.fn(),
  member: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: mocks.from }) }));
vi.mock("@/lib/auth/session", () => ({ requireProfile: mocks.profile }));
vi.mock("@/lib/actions/_shared", () => ({
  requireProjectMember: mocks.member,
  revalidateProject: mocks.revalidate,
}));
vi.mock("@/engines/impact/record-action.server", () => ({ recordImpactAction: vi.fn() }));
vi.mock("@/lib/supabase/notify", () => ({ createNotification: vi.fn() }));

import { createProjectGoal } from "@/lib/actions/project-workspace";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.profile.mockResolvedValue({ id: "member-1" });
  mocks.member.mockResolvedValue(null);
  mocks.maybeSingle.mockResolvedValue({ data: { id: "goal-1" }, error: null });
  mocks.select.mockReturnValue({ maybeSingle: mocks.maybeSingle });
  mocks.insert.mockReturnValue({ select: mocks.select });
  mocks.from.mockReturnValue({ insert: mocks.insert });
});

describe("goal creation persistence confirmation", () => {
  it("does not confirm or revalidate when insertion returns no row", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await createProjectGoal("project-1", { title: "Ship prototype" })).toEqual({
      error: "Goal creation could not be confirmed. Refresh before trying again.",
    });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("preserves the provider error and does not revalidate", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: { message: "Database unavailable" } });
    expect(await createProjectGoal("project-1", { title: "Ship prototype" })).toEqual({
      error: "Database unavailable",
    });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("keeps authentication before membership or insertion", async () => {
    mocks.profile.mockRejectedValue(new Error("Authentication required"));
    await expect(createProjectGoal("project-1", { title: "Ship prototype" })).rejects.toThrow("Authentication required");
    expect(mocks.member).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("keeps the project membership prerequisite before insertion", async () => {
    mocks.member.mockResolvedValue({ error: "You must be a project member" });
    expect(await createProjectGoal("project-1", { title: "Ship prototype" })).toEqual({
      error: "You must be a project member",
    });
    expect(mocks.member).toHaveBeenCalledWith(expect.anything(), "project-1", "member-1");
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("rejects an empty title without inserting", async () => {
    expect(await createProjectGoal("project-1", { title: "   " })).toEqual({ error: "Title is required" });
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("waits for the returned ID before preserving the empty-object success contract", async () => {
    let resolve!: (value: { data: { id: string }; error: null }) => void;
    mocks.maybeSingle.mockReturnValue(new Promise((done) => { resolve = done; }));
    const pending = createProjectGoal("project-1", { title: "  Ship prototype  " });
    await vi.waitFor(() => expect(mocks.maybeSingle).toHaveBeenCalledTimes(1));
    expect(mocks.revalidate).not.toHaveBeenCalled();
    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("project_goals");
    expect(mocks.select).toHaveBeenCalledExactlyOnceWith("id");
    expect(mocks.insert).toHaveBeenCalledWith({
      project_id: "project-1", creator_id: "member-1", title: "Ship prototype",
      description: null, goal_type: "weekly", due_date: null,
    });
    resolve({ data: { id: "goal-1" }, error: null });
    expect(await pending).toEqual({});
    expect(mocks.revalidate).toHaveBeenCalledExactlyOnceWith("project-1");
  });

  it("preserves explicit quarterly goal details", async () => {
    expect(await createProjectGoal("project-1", {
      title: "Ship prototype", description: "  Finish the reviewed scope  ", goalType: "quarterly", dueDate: "2026-12-31",
    })).toEqual({});
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      description: "Finish the reviewed scope", goal_type: "quarterly", due_date: "2026-12-31",
    }));
    expect(mocks.revalidate).toHaveBeenCalledExactlyOnceWith("project-1");
  });
});
