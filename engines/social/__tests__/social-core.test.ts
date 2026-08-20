import { describe, expect, it } from "vitest";
import {
  decodeSocialFeedCursor,
  decodeGlobalSocialFeedCursor,
  encodeSocialFeedCursor,
  encodeGlobalSocialFeedCursor,
  isOwnedSocialMediaPath,
  classifySocialMedia,
  validateSocialPostInput,
} from "@/engines/social";
import { getNotificationHref } from "@/systems/design-system/patterns/notification-type";

describe("social core validation", () => {
  it("round trips deterministic cursors", () => {
    const cursor = { createdAt: "2026-08-19T12:00:00.000Z", id: "post-id" };
    expect(decodeSocialFeedCursor(encodeSocialFeedCursor(cursor))).toEqual(cursor);
    expect(decodeSocialFeedCursor("invalid")).toBeNull();
  });

  it("round trips bounded global feed batch cursors", () => {
    const cursor = {
      beforeCreatedAt: "2026-08-19T12:00:00.000Z",
      beforeId: "post-id",
      offset: 30,
    };
    expect(
      decodeGlobalSocialFeedCursor(encodeGlobalSocialFeedCursor(cursor))
    ).toEqual(cursor);
  });

  it("requires body or owned media", () => {
    expect(validateSocialPostInput({ type: "TEXT" }, "user-1")).toBe(
      "Post content or media is required"
    );
    expect(validateSocialPostInput({ type: "TEXT", body: "Hello" }, "user-1")).toBeNull();
    expect(isOwnedSocialMediaPath("user-1/file.jpg", "user-1")).toBe(true);
    expect(isOwnedSocialMediaPath("user-2/file.jpg", "user-1")).toBe(false);
    expect(isOwnedSocialMediaPath("user-1/../file.jpg", "user-1")).toBe(false);
    expect(isOwnedSocialMediaPath("user-1\\file.jpg", "user-1")).toBe(false);
    expect(isOwnedSocialMediaPath("/user-1/file.jpg", "user-1")).toBe(false);
    expect(isOwnedSocialMediaPath("user-1/nested/file.jpg", "user-1")).toBe(false);
  });

  it("enforces media type and a single context", () => {
    expect(
      validateSocialPostInput(
        {
          type: "PHOTO",
          communityId: "community",
          projectId: "project",
          media: {
            url: "https://example.test/file.mp4",
            path: "user-1/file.mp4",
            type: "video",
            mimeType: "video/mp4",
            sizeBytes: 1024,
            name: "file.mp4",
          },
        },
        "user-1"
      )
    ).toBe("Choose either a community or a project");
    expect(
      validateSocialPostInput(
        {
          type: "PHOTO",
          media: {
            url: "https://example.test/file.mp4",
            path: "user-1/file.mp4",
            type: "video",
            mimeType: "video/mp4",
            sizeBytes: 1024,
            name: "file.mp4",
          },
        },
        "user-1"
      )
    ).toBe("Photo posts require an image");
  });

  it("enforces image and video upload limits", () => {
    expect(
      classifySocialMedia({ type: "image/jpeg", size: 5 * 1024 * 1024 })
    ).toEqual({ type: "image", maxBytes: 5 * 1024 * 1024 });
    expect(
      classifySocialMedia({ type: "video/mp4", size: 50 * 1024 * 1024 })
    ).toEqual({ type: "video", maxBytes: 50 * 1024 * 1024 });
    expect(
      classifySocialMedia({ type: "application/pdf", size: 100 })
    ).toBeNull();
  });

  it("deep-links social and connection notifications", () => {
    expect(
      getNotificationHref("system", {
        target_type: "social_post",
        post_id: "post-1",
      })
    ).toBe("/feed?post=post-1#post-post-1");
    expect(
      getNotificationHref("connection", { requester_id: "user-2" })
    ).toBe("/people/user-2");
  });
});
