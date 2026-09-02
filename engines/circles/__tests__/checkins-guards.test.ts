import { describe, expect, it } from "vitest";
import { canDeleteCheckin, canPostCheckin } from "../guards";

describe("accountability checkin guards", () => {
  describe("canPostCheckin", () => {
    it("lets an active member post as themselves", () => {
      expect(canPostCheckin({ userId: "user-a", status: "active" }, "user-a")).toBe(true);
    });

    it("does not let an invited (not yet accepted) member post", () => {
      expect(canPostCheckin({ userId: "user-a", status: "invited" }, "user-a")).toBe(false);
    });

    it("does not let a former member who left post", () => {
      expect(canPostCheckin({ userId: "user-a", status: "left" }, "user-a")).toBe(false);
    });

    it("does not let a user post using someone else's membership row", () => {
      expect(canPostCheckin({ userId: "user-a", status: "active" }, "user-b")).toBe(false);
    });

    it("does not let a user with no membership row post", () => {
      expect(canPostCheckin(null, "user-a")).toBe(false);
    });
  });

  describe("canDeleteCheckin", () => {
    it("lets the author delete their own checkin", () => {
      expect(canDeleteCheckin({ authorId: "user-a" }, "user-a")).toBe(true);
    });

    it("does not let another member delete someone else's checkin", () => {
      expect(canDeleteCheckin({ authorId: "user-a" }, "user-b")).toBe(false);
    });

    it("does not let the circle creator delete another member's checkin", () => {
      // canDeleteCheckin has no notion of circle creator at all -- unlike
      // canRemove for membership rows, deletion here is author-only, full stop.
      expect(canDeleteCheckin({ authorId: "user-a" }, "user-creator")).toBe(false);
    });
  });
});
