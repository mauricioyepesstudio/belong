import { describe, expect, it } from "vitest";
import { resolveHomeHeroActions } from "@/engines/belong/home/activation";
import type { CoachRecommendation } from "@/engines/belong/recommendation";

const recommendation: CoachRecommendation = {
  title: "Continue your mission",
  description: "Take the next step.",
  why: "It advances your goal.",
  actionLabel: "Open mission",
  actionHref: "/profile?tab=missions",
};

describe("resolveHomeHeroActions", () => {
  it("guides a new member to find a community first", () => {
    expect(
      resolveHomeHeroActions(
        { communities: 0, connections: 0, projects: 0 },
        recommendation
      ).primary
    ).toEqual({ kind: "join-community", label: "Find a community" });
  });

  it("guides a community member to meet builders", () => {
    expect(
      resolveHomeHeroActions(
        { communities: 1, connections: 0, projects: 0 },
        recommendation
      ).primary
    ).toEqual({
      kind: "href",
      label: "Meet builders",
      href: "/community?tab=people",
    });
  });

  it("guides a connected member to create a first project", () => {
    expect(
      resolveHomeHeroActions(
        { communities: 1, connections: 2, projects: 0 },
        recommendation
      ).primary
    ).toEqual({ kind: "create-project", label: "Create your first project" });
  });

  it("uses the current recommendation for an established member", () => {
    expect(
      resolveHomeHeroActions(
        { communities: 2, connections: 3, projects: 1 },
        recommendation
      ).primary
    ).toEqual({
      kind: "href",
      label: "Open mission",
      href: "/profile?tab=missions",
    });
  });
});
