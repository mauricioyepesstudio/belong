import { describe, expect, it } from "vitest";
import { canAccept, canInvite, canRemove, isAtCapacity } from "../guards";
import { CIRCLE_MAX_MEMBERS } from "../types";

describe("accountability circle guards", () => {
  describe("canInvite", () => {
    const circle = { creatorId: "user-creator" };

    it("lets the creator invite even before their own membership row exists", () => {
      expect(canInvite(circle, { userId: "user-creator", status: null })).toBe(true);
    });

    it("lets an active member invite", () => {
      expect(canInvite(circle, { userId: "user-b", status: "active" })).toBe(true);
    });

    it("does not let an invited (not yet accepted) member invite", () => {
      expect(canInvite(circle, { userId: "user-b", status: "invited" })).toBe(false);
    });

    it("does not let a former member who left invite", () => {
      expect(canInvite(circle, { userId: "user-b", status: "left" })).toBe(false);
    });

    it("does not let an unrelated user with no membership invite", () => {
      expect(canInvite(circle, { userId: "user-c", status: null })).toBe(false);
    });
  });

  describe("canAccept", () => {
    it("lets a user accept their own invited row", () => {
      expect(canAccept({ userId: "user-a", status: "invited" }, "user-a")).toBe(true);
    });

    it("does not let a user accept someone else's invited row", () => {
      expect(canAccept({ userId: "user-a", status: "invited" }, "user-b")).toBe(false);
    });

    it("does not let a user re-accept an already active row", () => {
      expect(canAccept({ userId: "user-a", status: "active" }, "user-a")).toBe(false);
    });

    it("does not let a user accept a row they already left", () => {
      expect(canAccept({ userId: "user-a", status: "left" }, "user-a")).toBe(false);
    });
  });

  describe("canRemove", () => {
    const circle = { creatorId: "user-creator" };

    it("lets a member remove (leave/decline) their own row", () => {
      expect(canRemove(circle, "user-b", "user-b")).toBe(true);
    });

    it("lets the creator remove any member", () => {
      expect(canRemove(circle, "user-creator", "user-b")).toBe(true);
    });

    it("does not let a non-creator member remove someone else", () => {
      expect(canRemove(circle, "user-b", "user-c")).toBe(false);
    });

    it("lets the creator remove themselves", () => {
      expect(canRemove(circle, "user-creator", "user-creator")).toBe(true);
    });
  });

  describe("isAtCapacity", () => {
    it("is not at capacity below the cap", () => {
      expect(isAtCapacity(CIRCLE_MAX_MEMBERS - 1)).toBe(false);
    });

    it("is at capacity exactly at the cap", () => {
      expect(isAtCapacity(CIRCLE_MAX_MEMBERS)).toBe(true);
    });

    it("is at capacity above the cap", () => {
      expect(isAtCapacity(CIRCLE_MAX_MEMBERS + 1)).toBe(true);
    });

    it("is not at capacity with zero members", () => {
      expect(isAtCapacity(0)).toBe(false);
    });
  });
});
