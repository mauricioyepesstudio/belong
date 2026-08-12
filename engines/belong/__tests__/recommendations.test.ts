import { describe, expect, it } from "vitest";
import { selectCompactRecommendations } from "@/engines/belong/home/recommendations";
import type {
  OpportunityRecommendations,
  ScoredRecommendation,
} from "@/engines/opportunity";

function recommendation(
  id: string,
  title: string,
  score: number,
  href = "/projects"
): ScoredRecommendation {
  return {
    id,
    category: "missions",
    title,
    subtitle: "Daily mission",
    href,
    score,
    reasons: [],
    factors: [],
    explanation: {
      confidence: "low",
      bullets: [],
      details: {
        sharedSkills: [],
        sharedCommunities: [],
        sharedInterests: [],
        mutualCollaborators: [],
        currentOpportunities: [],
      },
      scoreBreakdown: {
        totalScore: score,
        weightedPoints: score,
        maxPossiblePoints: 100,
        formula: "test fixture",
        factors: [],
      },
    },
  };
}

function collection(missions: ScoredRecommendation[]): OpportunityRecommendations {
  return {
    people: [],
    projects: [],
    communities: [],
    organizations: [],
    missions,
  };
}

describe("selectCompactRecommendations", () => {
  it("keeps the highest-scoring instance of an equivalent recommendation", () => {
    const result = selectCompactRecommendations(
      collection([
        recommendation("mission-1", "Advance an active project", 98),
        recommendation("mission-2", "Advance an active project", 92),
        recommendation("mission-3", "Define your next milestone", 85),
      ])
    );

    expect(result.map((item) => item.id)).toEqual(["mission-1", "mission-3"]);
  });

  it("keeps recommendations with the same title when their destination differs", () => {
    const result = selectCompactRecommendations(
      collection([
        recommendation("mission-1", "Open project", 95, "/projects/one"),
        recommendation("mission-2", "Open project", 90, "/projects/two"),
      ])
    );

    expect(result).toHaveLength(2);
  });

  it("limits the compact list after deduplication", () => {
    const result = selectCompactRecommendations(
      collection([
        recommendation("1", "One", 100),
        recommendation("2", "Two", 90),
        recommendation("3", "Three", 80),
      ]),
      2
    );

    expect(result.map((item) => item.id)).toEqual(["1", "2"]);
  });
});
