import { describe, expect, it } from "vitest";
import { resolveCommunityAction } from "../show-up-resolver";
import type { CommunityDetail } from "@/lib/core";

const mockCommunityData = {
  community: { id: "c1", name: "Test", slug: "test", is_paid: false },
  membership: null,
  posts: [],
  memberCount: 0,
  members: [],
  owner: null,
} as unknown as CommunityDetail;

describe("community show-up resolver", () => {
  it("resolves JOIN for non-member", () => {
    const action = resolveCommunityAction(mockCommunityData, false, false);
    expect(action.kind).toBe("JOIN");
    expect(action.label).toBe("Join community");
  });

  it("resolves ACTIVE for member", () => {
    const action = resolveCommunityAction(mockCommunityData, true, false);
    expect(action.kind).toBe("COLLABORATE");
    expect(action.label).toBe("Member");
    expect(action.state).toBe("ACTIVE");
  });
});
