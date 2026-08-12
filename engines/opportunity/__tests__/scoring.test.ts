import { describe, expect, it } from "vitest";
import {
  computeCompatibilityScore,
  jaccardSimilarity,
  locationMatches,
  overlapMatches,
  pickTopReasons,
  SCORE_WEIGHTS,
} from "../scoring";
import { scoreCommunityMatch, scorePersonMatch, scoreProjectMatch } from "../matchers";
import type { CommunityCandidate, CompatibilityProfile, PersonCandidate, ProjectCandidate } from "../types";

const graphContext = { membersByCommunity: {}, userNames: {} };

const baseProfile: CompatibilityProfile = {
  userId: "user-1",
  fullName: "Sarah Chen",
  role: "Founder",
  location: "San Francisco, CA",
  bio: "Building mission-driven products",
  buildGoal: "startup",
  buildVision: "Help builders ship",
  skills: ["Product Management", "Go-to-market"],
  interests: ["Startups", "AI tools", "Writing"],
  strengths: ["Strategy"],
  values: ["Impact"],
  communityIds: ["comm-1"],
  communityNames: { "comm-1": "Indie Founders Circle" },
  projectIds: [],
  projectNames: {},
  organizationIds: [],
  activityModules: ["community", "project"],
  currentStreak: 5,
  connectionIds: [],
  connectionNames: {},
};

describe("opportunity scoring", () => {
  it("computes weighted compatibility scores", () => {
    const result = computeCompatibilityScore([
      {
        key: "skillOverlap",
        weight: SCORE_WEIGHTS.skillOverlap,
        strength: 1,
        reason: "Because your design skills match this project",
      },
      {
        key: "interestOverlap",
        weight: SCORE_WEIGHTS.interestOverlap,
        strength: 0.5,
        reason: "Because you are interested in AI",
      },
    ]);

    expect(result.score).toBeGreaterThan(0);
    expect(result.factors).toHaveLength(2);
  });

  it("matches overlapping skills and interests", () => {
    expect(overlapMatches(["Design", "Figma"], ["figma", "Research"])).toEqual(["Figma"]);
    expect(jaccardSimilarity(["ai", "design"], ["design", "product"])).toBeCloseTo(1 / 3);
    expect(locationMatches("San Francisco, CA", "San Francisco, US")).toBe(true);
  });

  it("picks the strongest reasons first", () => {
    const reasons = pickTopReasons([
      { score: 10, reason: "Because you are interested in AI" },
      { score: 30, reason: "Because you joined Miami Builders" },
      { score: 30, reason: "Because you joined Miami Builders" },
    ]);

    expect(reasons).toEqual([
      "Because you joined Miami Builders",
      "Because you are interested in AI",
    ]);
  });
});

describe("opportunity matchers", () => {
  it("scores people by shared interests and communities", () => {
    const candidate: PersonCandidate = {
      id: "user-2",
      fullName: "Jordan Lee",
      avatarUrl: null,
      role: "Founder",
      location: "San Francisco, CA",
      bio: "Building AI tools for creators",
      buildGoal: "startup",
      skills: ["React", "Product Management"],
      interests: ["AI tools", "Startups"],
      communityIds: ["comm-1"],
      projectIds: [],
    };

    const result = scorePersonMatch(baseProfile, candidate, graphContext);
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThan(0);
    expect(result!.reasons.length).toBeGreaterThan(0);
    expect(
      result!.reasons.some((r) => r.includes("AI") || r.includes("Startups") || r.includes("Product"))
    ).toBe(true);
  });

  it("scores projects by skill overlap", () => {
    const candidate: ProjectCandidate = {
      id: "proj-1",
      name: "LLM Fine-tuning Kit",
      description: "Starter kit for AI product teams",
      status: "active",
      communityId: "comm-5",
      communityName: "AI Builders Lab",
      communitySlug: "ai-builders",
      communityTag: "AI",
    };

    const result = scoreProjectMatch(baseProfile, candidate);
    expect(result).not.toBeNull();
    expect(result!.reasons.length).toBeGreaterThan(0);
    expect(result!.meta?.actionHref).toBe("/community/ai-builders");
    expect(result!.meta?.actionLabel).toBe("Join community first");
  });

  it("opens a project directly when the user already belongs to its community", () => {
    const candidate: ProjectCandidate = {
      id: "proj-2",
      name: "Founder Launchpad",
      description: "A startup project for founders",
      status: "active",
      communityId: "comm-1",
      communityName: "Indie Founders Circle",
      communitySlug: "indie-founders",
      communityTag: "Startups",
    };

    const result = scoreProjectMatch(baseProfile, candidate);
    expect(result).not.toBeNull();
    expect(result!.meta?.actionHref).toBe("/projects/proj-2");
    expect(result!.meta?.actionLabel).toBe("Open project");
  });

  it("scores communities by tag and interests", () => {
    const candidate: CommunityCandidate = {
      id: "comm-5",
      name: "AI Builders Lab",
      slug: "ai-builders",
      description: "Experimenting with LLMs and AI-native workflows",
      tag: "AI",
      memberCount: 42,
    };

    const result = scoreCommunityMatch(baseProfile, candidate);
    expect(result).not.toBeNull();
    expect(result!.href).toBe("/community/ai-builders");
  });
});
