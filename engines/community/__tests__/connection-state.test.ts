import { describe, expect, it } from "vitest";
import {
  canMessageConnection,
  resolveConnectionState,
} from "@/lib/core/connection-state";

const viewerId = "mateo";
const otherId = "mauricio";

describe("resolveConnectionState", () => {
  it("returns none when the users have no active relationship", () => {
    expect(resolveConnectionState(viewerId, [])).toEqual({ id: null, state: "none" });
  });

  it("identifies a sent pending request", () => {
    expect(
      resolveConnectionState(viewerId, [
        { id: "request-1", requester_id: viewerId, recipient_id: otherId, status: "pending" },
      ])
    ).toEqual({ id: "request-1", state: "pending-sent" });
  });

  it("identifies a received pending request", () => {
    expect(
      resolveConnectionState(viewerId, [
        { id: "request-1", requester_id: otherId, recipient_id: viewerId, status: "pending" },
      ])
    ).toEqual({ id: "request-1", state: "pending-received" });
  });

  it.each([
    { requester_id: viewerId, recipient_id: otherId },
    { requester_id: otherId, recipient_id: viewerId },
  ])("identifies an accepted connection in either orientation", (orientation) => {
    expect(
      resolveConnectionState(viewerId, [
        { id: "connection-1", ...orientation, status: "accepted" },
      ])
    ).toEqual({ id: "connection-1", state: "connected" });
  });

  it("treats a declined request as no relationship", () => {
    expect(
      resolveConnectionState(viewerId, [
        { id: "request-1", requester_id: otherId, recipient_id: viewerId, status: "declined" },
      ])
    ).toEqual({ id: null, state: "none" });
  });

  it.each(["none", "pending-sent", "pending-received"] as const)(
    "does not expose messaging while the connection is %s",
    (state) => {
      expect(canMessageConnection(state)).toBe(false);
    }
  );

  it("exposes messaging once the connection is accepted", () => {
    const connection = resolveConnectionState(viewerId, [
      {
        id: "connection-1",
        requester_id: otherId,
        recipient_id: viewerId,
        status: "accepted",
      },
    ]);

    expect(canMessageConnection(connection.state)).toBe(true);
  });
});
