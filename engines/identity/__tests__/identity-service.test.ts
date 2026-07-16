import { describe, expect, it, beforeEach } from "vitest";
import { IdentityEngineServiceImpl } from "../services/identity-service";
import type {
  IdentityProfileRecord,
  IdentityRepository,
  UserProfileRecord,
} from "../ports/identity-repository";
import type { UserSkillsRepository } from "../ports/user-skills-repository";
import { emptyIdentityProfile } from "../infrastructure/mapper";

class InMemoryIdentityRepository implements IdentityRepository {
  private users = new Map<string, UserProfileRecord>();
  private profiles = new Map<string, IdentityProfileRecord>();

  seedUser(user: UserProfileRecord) {
    this.users.set(user.id, user);
  }

  async findUserProfile(userId: string) {
    return this.users.get(userId) ?? null;
  }

  async updateUserProfile(userId: string, patch: Partial<UserProfileRecord>) {
    const existing = this.users.get(userId);
    if (!existing) throw new Error("User not found");

    const updated = {
      ...existing,
      ...patch,
      updated_at: new Date().toISOString(),
    };
    this.users.set(userId, updated);
    return updated;
  }

  async findIdentityProfile(userId: string) {
    return this.profiles.get(userId) ?? null;
  }

  async upsertIdentityProfile(
    userId: string,
    patch: Pick<
      IdentityProfileRecord,
      "strengths" | "interests" | "values" | "personality" | "experience"
    >
  ) {
    const existing = this.profiles.get(userId) ?? emptyIdentityProfile(userId);
    const updated: IdentityProfileRecord = {
      ...existing,
      ...patch,
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(userId, updated);
    return updated;
  }
}

class InMemoryUserSkillsRepository implements UserSkillsRepository {
  private skills = new Map<string, string[]>();

  seedSkills(userId: string, values: string[]) {
    this.skills.set(userId, values);
  }

  async findByUserId(userId: string) {
    return this.skills.get(userId) ?? [];
  }

  async replaceAll(userId: string, values: string[]) {
    this.skills.set(userId, values);
    return values;
  }
}

describe("IdentityEngineServiceImpl", () => {
  const userId = "user-1";
  let identityRepository: InMemoryIdentityRepository;
  let skillsRepository: InMemoryUserSkillsRepository;
  let service: IdentityEngineServiceImpl;

  beforeEach(() => {
    identityRepository = new InMemoryIdentityRepository();
    skillsRepository = new InMemoryUserSkillsRepository();
    service = new IdentityEngineServiceImpl(identityRepository, skillsRepository);

    identityRepository.seedUser({
      id: userId,
      email: "alex@belong.app",
      full_name: "Alex Rivera",
      avatar_url: null,
      role: null,
      location: null,
      bio: null,
      created_at: "2025-01-01T00:00:00.000Z",
      updated_at: "2025-01-01T00:00:00.000Z",
    });
  });

  it("creates an identity profile on first read", async () => {
    const data = await service.getIdentityData({ userId });
    expect(data?.identity.userId).toBe(userId);
    expect(data?.completeness.score).toBeGreaterThan(0);
    expect(data?.completeness.missingFields).toContain("bio");
  });

  it("updates core profile fields", async () => {
    const identity = await service.updateProfile(
      { userId },
      {
        bio: "Purpose-driven builder",
        location: "Austin",
        role: "Founder",
      }
    );

    expect(identity.bio.value).toBe("Purpose-driven builder");
    expect(identity.location.value).toBe("Austin");
    expect(identity.role.value).toBe("Founder");
  });

  it("stores collections and personality data", async () => {
    await service.setCollections(
      { userId },
      {
        strengths: ["Empathy", "Focus"],
        interests: ["Education"],
        values: ["Integrity"],
        skills: ["Strategy", "Design"],
      }
    );

    const identity = await service.updatePersonality(
      { userId },
      {
        traits: [{ name: "Curiosity", score: 4, description: "Learns quickly" }],
      }
    );

    expect(identity.strengthValues).toEqual(["Empathy", "Focus"]);
    expect(identity.skillValues).toEqual(["Strategy", "Design"]);
    expect(identity.personalityTraits[0]?.name).toBe("Curiosity");
  });

  it("calculates completeness based on filled identity dimensions", async () => {
    await service.updateProfile(
      { userId },
      {
        bio: "Builder",
        location: "Austin",
        role: "Founder",
      }
    );

    await service.setCollections(
      { userId },
      {
        strengths: ["Empathy"],
        interests: ["Education"],
        values: ["Integrity"],
        skills: ["Strategy"],
      }
    );

    await service.updatePersonality(
      { userId },
      { traits: [{ name: "Curiosity", score: 4 }] }
    );

    await service.setExperience(
      { userId },
      [
        {
          title: "Product Lead",
          organization: "BELONG",
          startYear: 2022,
        },
      ]
    );

    const identity = await service.getIdentity({ userId });
    const completeness = service.calculateCompleteness(identity!);

    expect(completeness.score).toBe(100);
    expect(completeness.missingFields).toEqual([]);
  });
});
