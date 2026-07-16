import { describe, expect, it } from "vitest";
import { toUserIdentity, toUserProfilePatch, emptyIdentityProfile } from "../infrastructure/mapper";

describe("identity mapper", () => {
  it("maps persistence records into a domain identity", () => {
    const user = {
      id: "user-1",
      email: "alex@belong.app",
      full_name: "Alex Rivera",
      avatar_url: null,
      role: "Founder",
      location: "Austin",
      bio: "Building purpose-driven communities.",
      created_at: "2025-01-01T00:00:00.000Z",
      updated_at: "2025-01-02T00:00:00.000Z",
    };

    const profile = {
      ...emptyIdentityProfile("user-1"),
      strengths: ["Empathy", "Focus"],
      interests: ["Education"],
      values: ["Integrity"],
      personality: {
        traits: [{ name: "Curiosity", description: "Learns quickly", score: 4 }],
      },
      experience: [
        {
          id: "exp-1",
          title: "Product Lead",
          organization: "BELONG",
          startYear: 2022,
          endYear: null,
          description: null,
        },
      ],
    };

    const identity = toUserIdentity(user, profile, ["Strategy", "Design"]);

    expect(identity.displayName).toBe("Alex Rivera");
    expect(identity.strengthValues).toEqual(["Empathy", "Focus"]);
    expect(identity.skillValues).toEqual(["Strategy", "Design"]);
    expect(identity.personalityTraits[0]?.name).toBe("Curiosity");
    expect(identity.experienceEntries[0]?.organization).toBe("BELONG");
  });

  it("normalizes profile patches through value objects", () => {
    const patch = toUserProfilePatch({
      name: "  Alex  ",
      bio: "  Builder  ",
      location: " Austin ",
      role: " Founder ",
    });

    expect(patch).toEqual({
      full_name: "Alex",
      bio: "Builder",
      location: "Austin",
      role: "Founder",
    });
  });
});
