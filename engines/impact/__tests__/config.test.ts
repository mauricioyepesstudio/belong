import { describe, expect, it } from "vitest";
import { getImpactPoints, IMPACT_SCORE_POINTS } from "@/engines/impact/config";

describe("impact score config", () => {
  it("uses v1 participation point values", () => {
    expect(IMPACT_SCORE_POINTS.project_created).toBe(5);
    expect(IMPACT_SCORE_POINTS.community_join).toBe(3);
    expect(IMPACT_SCORE_POINTS.mission_completed).toBe(5);
    expect(IMPACT_SCORE_POINTS.community_post).toBe(2);
    expect(IMPACT_SCORE_POINTS.collaboration_started).toBe(3);
    expect(IMPACT_SCORE_POINTS.event_organized).toBe(4);
    expect(IMPACT_SCORE_POINTS.profile_completed).toBe(1);
    expect(IMPACT_SCORE_POINTS.organization_join).toBe(2);
  });

  it("allows point overrides", () => {
    expect(getImpactPoints("community_post", 10)).toBe(10);
  });
});
