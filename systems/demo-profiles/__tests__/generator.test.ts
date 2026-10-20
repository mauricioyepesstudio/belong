import { describe, expect, it } from "vitest";
import {
  DEMO_BIO_PREFIX,
  DEMO_EMAIL_DOMAIN,
  buildDemoProfiles,
  isDemoEmail,
} from "../generator";

const date = new Date("2026-10-20T14:00:00Z");
const BUILD_GOALS = ["startup", "career", "learn", "health", "relationships", "community", "travel", "creator"];

describe("buildDemoProfiles", () => {
  it("returns the requested number of profiles", () => {
    expect(buildDemoProfiles(5, 1, date)).toHaveLength(5);
  });

  it("is deterministic for the same seed", () => {
    expect(buildDemoProfiles(3, 42, date)).toEqual(buildDemoProfiles(3, 42, date));
  });

  it("marks every profile as demo (reserved email domain + visible bio label)", () => {
    for (const p of buildDemoProfiles(20, 7, date)) {
      expect(p.email.endsWith(`@${DEMO_EMAIL_DOMAIN}`)).toBe(true);
      expect(isDemoEmail(p.email)).toBe(true);
      expect(p.bio.startsWith(DEMO_BIO_PREFIX)).toBe(true);
      expect(p.email).toContain("20261020");
    }
  });

  it("produces ascii-only, unique emails", () => {
    const emails = buildDemoProfiles(20, 3, date).map((p) => p.email);
    expect(new Set(emails).size).toBe(emails.length);
    for (const email of emails) expect(email).toMatch(/^[a-z0-9-]+@demo\.belong\.app$/);
  });

  it("only uses valid build goals and fits the database constraints", () => {
    for (const p of buildDemoProfiles(20, 9, date)) {
      expect(BUILD_GOALS).toContain(p.buildGoal);
      expect(p.introPost.trim().length).toBeGreaterThan(0);
      expect(p.skills.length).toBeGreaterThan(0);
      expect(p.streak).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("isDemoEmail", () => {
  it("rejects real addresses", () => {
    expect(isDemoEmail("someone@gmail.com")).toBe(false);
    expect(isDemoEmail("demo.belong.app@gmail.com")).toBe(false);
    expect(isDemoEmail(null)).toBe(false);
  });
});
