import { describe, expect, it } from "vitest";
import { resolvePersonAction } from "../show-up-resolver";
import type { DiscoveryPerson } from "@/engines/opportunity/discovery";
import type { UserConnectionState } from "@/lib/core/connection-state";

const mockPerson = (state: UserConnectionState["state"]): DiscoveryPerson => ({
  id: "p1",
  fullName: "Test Person",
  role: "Builder",
  connectionState: { state },
  tags: [],
} as unknown as DiscoveryPerson);

describe("person show-up resolver", () => {
  it("resolves Message for connected", () => {
    const action = resolvePersonAction(mockPerson("connected"));
    expect(action.kind).toBe("COLLABORATE");
    expect(action.label).toBe("Message");
  });

  it("resolves Request sent for pending", () => {
    const action = resolvePersonAction(mockPerson("pending-sent"));
    expect(action.kind).toBe("COLLABORATE");
    expect(action.state).toBe("PENDING");
  });

  it("resolves Connect for recommended", () => {
    const action = resolvePersonAction(mockPerson("none"));
    expect(action.kind).toBe("JOIN");
    expect(action.label).toBe("Connect");
  });
});
