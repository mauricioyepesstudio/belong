import { describe, expect, it } from "vitest";
import {
  computeReputationScores,
  defaultPointsForEvent,
  founderLabel,
  progressToNextLevel,
  reputationLevelFromScore,
} from "@/engines/identity/reputation/calculate";

describe("identity reputation calculate", () => {
  it("assigns default points per event type", () => {
    expect(defaultPointsForEvent("mission_completed")).toBe(5);
    expect(defaultPointsForEvent("project_created")).toBe(5);
    expect(defaultPointsForEvent("mission_completed", 25)).toBe(25);
  });

  it("computes composite reputation scores", () => {
    const scores = computeReputationScores({
      eventPointsByModule: { mission: 40, community: 30, project: 20, organization: 0, event: 0, system: 0 },
      eventCountsByType: { project_join: 2, community_comment: 3 },
      founderReputation: 50,
      connections: 5,
      projectsJoined: 2,
      missionsCompleted: 8,
      missionsTotal: 10,
      projectsCompleted: 1,
      projectsTotal: 2,
      communityContributionPoints: 45,
    });

    expect(scores.missionCompletionRate).toBe(80);
    expect(scores.projectCompletionScore).toBe(50);
    expect(scores.founderScore).toBe(50);
    expect(scores.communityContributionScore).toBe(45);
    expect(scores.collaborationScore).toBeGreaterThan(0);
    expect(scores.reputationScore).toBeGreaterThan(80);
  });

  it("maps impact totals to reputation levels", () => {
    expect(reputationLevelFromScore(10)).toBe("Emerging");
    expect(reputationLevelFromScore(120)).toBe("Growing");
    expect(reputationLevelFromScore(520)).toBe("Legend");
  });

  it("calculates progress to next level", () => {
    expect(progressToNextLevel(75)).toBe(50);
    expect(progressToNextLevel(500)).toBe(100);
  });

  it("labels founder tiers", () => {
    expect(founderLabel(5)).toBe("Emerging Founder");
    expect(founderLabel(120)).toBe("Established Founder");
  });
});
