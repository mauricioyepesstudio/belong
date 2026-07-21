import { describe, expect, it } from "vitest";
import {
  buildExplanationBullets,
  buildRecommendationExplanation,
  computeConfidenceLevel,
} from "../explanation";
import { SCORE_WEIGHTS } from "../scoring";
import { scoreCommunityMatch, scorePersonMatch, scoreProjectMatch } from "../matchers";
import type {
  CommunityCandidate,
  CompatibilityProfile,
  MatchSignals,
  PersonCandidate,
  ProjectCandidate,
} from "../types";

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
  projectIds: ["proj-1"],
  projectNames: { "proj-1": "BELONG Mobile App" },
  organizationIds: [],
  activityModules: ["community", "project"],
  currentStreak: 5,
  connectionIds: ["user-3"],
  connectionNames: { "user-3": "Marcus Rivera" },
};

const graphContext = {
  membersByCommunity: {
    "comm-1": ["user-1", "user-2", "user-3"],
  },
  userNames: {
    "user-2": "Jordan Lee",
    "user-3": "Marcus Rivera",
  },
};

describe("opportunity explanation", () => {
  it("builds checkmark-style bullets from signals", () => {
    const signals: MatchSignals = {
      sharedSkills: ["Design"],
      sharedInterests: ["AI", "Startups", "Writing"],
      sharedCommunities: ["Indie Founders Circle"],
      sharedProjects: [],
      mutualCollaborators: ["Marcus Rivera"],
      skillsNeeded: ["Design"],
      locationMatch: true,
      locationLabel: "San Francisco",
      buildGoalMatch: true,
      buildGoalLabel: "startup",
      lookingForCollaborators: true,
      activeProject: false,
      missionAlignment: false,
      activityMatch: false,
      currentOpportunities: ["Open to collaborating"],
    };

    const bullets = buildExplanationBullets(signals);
    expect(bullets.some((b) => b.label.includes("3 shared interests"))).toBe(true);
    expect(bullets.some((b) => b.label.includes("Indie Founders Circle"))).toBe(true);
    expect(bullets.some((b) => b.label.includes("Design skills needed"))).toBe(true);
    expect(bullets.some((b) => b.label.includes("San Francisco"))).toBe(true);
    expect(bullets.some((b) => b.label.includes("collaborators"))).toBe(true);
  });

  it("computes confidence levels deterministically", () => {
    expect(computeConfidenceLevel(80, 4)).toBe("high");
    expect(computeConfidenceLevel(55, 2)).toBe("medium");
    expect(computeConfidenceLevel(30, 1)).toBe("low");
  });

  it("includes exposed score breakdown formula", () => {
    const explanation = buildRecommendationExplanation(
      [
        {
          key: "skillOverlap",
          weight: SCORE_WEIGHTS.skillOverlap,
          strength: 1,
          reason: "skill match",
        },
        {
          key: "interestOverlap",
          weight: SCORE_WEIGHTS.interestOverlap,
          strength: 0.5,
          reason: "interest match",
        },
      ],
      {
        sharedSkills: ["Design"],
        sharedInterests: ["AI"],
        sharedCommunities: [],
        sharedProjects: [],
        mutualCollaborators: [],
        skillsNeeded: ["Design"],
        locationMatch: false,
        buildGoalMatch: false,
        lookingForCollaborators: false,
        activeProject: false,
        missionAlignment: false,
        activityMatch: false,
        currentOpportunities: [],
      }
    );

    expect(explanation.scoreBreakdown.formula).toContain("× 100");
    expect(explanation.scoreBreakdown.totalScore).toBeGreaterThan(0);
    expect(explanation.bullets.length).toBeGreaterThan(0);
  });
});

describe("opportunity matchers with explanation", () => {
  it("scores people with explanation payload", () => {
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
    expect(result!.explanation.bullets.length).toBeGreaterThan(0);
    expect(result!.explanation.confidence).toBeDefined();
    expect(result!.explanation.details.sharedInterests.length).toBeGreaterThan(0);
  });

  it("scores projects with skills-needed bullets", () => {
    const candidate: ProjectCandidate = {
      id: "proj-1",
      name: "LLM Fine-tuning Kit",
      description: "Starter kit for AI product teams needing product management",
      status: "active",
      communityId: "comm-5",
      communityName: "AI Builders Lab",
      communityTag: "AI",
    };

    const result = scoreProjectMatch(baseProfile, candidate);
    expect(result).not.toBeNull();
    expect(
      result!.explanation.bullets.some(
        (b) => b.kind === "skills_needed" || b.kind === "looking_for_collaborators"
      )
    ).toBe(true);
  });

  it("scores communities with tag bullets", () => {
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
    expect(result!.explanation.details.currentOpportunities.length).toBeGreaterThan(0);
  });
});
