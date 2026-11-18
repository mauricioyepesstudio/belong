import { describe, expect, it } from "vitest";
import {
  CIRCLE_INVITE_CODE_LENGTH,
  circleInvitePath,
  generateCircleInviteCode,
  normalizeCircleInviteCode,
} from "../invite-link";

describe("generateCircleInviteCode", () => {
  it("returns a lowercase alphanumeric code of the expected length", () => {
    const code = generateCircleInviteCode();
    expect(code).toHaveLength(CIRCLE_INVITE_CODE_LENGTH);
    expect(code).toMatch(/^[a-z0-9]+$/);
  });

  it("maps bytes deterministically onto the alphabet", () => {
    const code = generateCircleInviteCode((bytes) => bytes.fill(0));
    expect(code).toBe("a".repeat(CIRCLE_INVITE_CODE_LENGTH));
  });

  it("produces a code the normalizer accepts", () => {
    const code = generateCircleInviteCode();
    expect(normalizeCircleInviteCode(code)).toBe(code);
  });
});

describe("normalizeCircleInviteCode", () => {
  it("lowercases and trims a valid code", () => {
    expect(normalizeCircleInviteCode("  ABCDEF123456  ")).toBe("abcdef123456");
  });

  it("rejects empty, short, long and non-alphanumeric codes", () => {
    expect(normalizeCircleInviteCode(undefined)).toBeNull();
    expect(normalizeCircleInviteCode("")).toBeNull();
    expect(normalizeCircleInviteCode("abc123")).toBeNull();
    expect(normalizeCircleInviteCode("a".repeat(33))).toBeNull();
    expect(normalizeCircleInviteCode("abcdef-123456")).toBeNull();
    expect(normalizeCircleInviteCode("abcdef123456'--")).toBeNull();
  });
});

describe("circleInvitePath", () => {
  it("builds the join path", () => {
    expect(circleInvitePath("abcdef123456")).toBe("/circles/join/abcdef123456");
  });
});
