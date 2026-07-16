import { IDENTITY_COMPLETENESS_WEIGHTS } from "../constants";
import { IdentityEngineError } from "../domain/errors";
import type { UserIdentity } from "../domain/entities/user-identity";
import { LabeledItem } from "../domain/value-objects/labeled-item";
import { PersonalityProfile } from "../domain/value-objects/personality-profile";
import type { IdentityEngineService } from "../identity-engine";
import {
  toExperienceCollection,
  toIdentityProfilePatch,
  toUserIdentity,
  toUserProfilePatch,
} from "../infrastructure/mapper";
import type { IdentityRepository } from "../ports/identity-repository";
import type { UserSkillsRepository } from "../ports/user-skills-repository";
import type {
  ExperienceEntryInput,
  IdentityCompleteness,
  IdentityEngineContext,
  IdentityEngineData,
  SetIdentityCollectionInput,
  UpdateIdentityProfileInput,
  UpdatePersonalityInput,
} from "../types";
import type { SupabaseServerClient } from "@/lib/core/types";
import { SupabaseIdentityRepository } from "../infrastructure/supabase-identity-repository";
import { SupabaseUserSkillsRepository } from "../infrastructure/supabase-user-skills-repository";

export class IdentityEngineServiceImpl implements IdentityEngineService {
  constructor(
    private readonly identityRepository: IdentityRepository,
    private readonly skillsRepository: UserSkillsRepository
  ) {}

  async getIdentity(context: IdentityEngineContext): Promise<UserIdentity | null> {
    const data = await this.getIdentityData(context);
    return data?.identity ?? null;
  }

  async getIdentityData(context: IdentityEngineContext): Promise<IdentityEngineData | null> {
    const user = await this.identityRepository.findUserProfile(context.userId);
    if (!user) return null;

    const [profile, skills] = await Promise.all([
      this.ensureIdentityProfile(context.userId),
      this.skillsRepository.findByUserId(context.userId),
    ]);

    const identity = toUserIdentity(user, profile, skills);
    return {
      identity,
      completeness: this.calculateCompleteness(identity),
    };
  }

  calculateCompleteness(identity: UserIdentity): IdentityCompleteness {
    const filledFields: string[] = [];
    const missingFields: string[] = [];
    let score = 0;

    const checks: Array<[keyof typeof IDENTITY_COMPLETENESS_WEIGHTS, boolean]> = [
      ["name", Boolean(identity.name.value)],
      ["bio", Boolean(identity.bio.value)],
      ["location", Boolean(identity.location.value)],
      ["role", Boolean(identity.role.value)],
      ["skills", identity.skills.length > 0],
      ["strengths", identity.strengths.length > 0],
      ["interests", identity.interests.length > 0],
      ["values", identity.values.length > 0],
      ["personality", identity.personality.traits.length > 0],
      ["experience", identity.experience.entries.length > 0],
    ];

    for (const [field, isFilled] of checks) {
      if (isFilled) {
        filledFields.push(field);
        score += IDENTITY_COMPLETENESS_WEIGHTS[field];
      } else {
        missingFields.push(field);
      }
    }

    return { score, filledFields, missingFields };
  }

  async updateProfile(
    context: IdentityEngineContext,
    input: UpdateIdentityProfileInput
  ): Promise<UserIdentity> {
    const existing = await this.identityRepository.findUserProfile(context.userId);
    if (!existing) throw new IdentityEngineError("User not found");

    const patch = toUserProfilePatch(input);
    const updatedUser = Object.keys(patch).length
      ? await this.identityRepository.updateUserProfile(context.userId, patch)
      : existing;

    const [profile, skills] = await Promise.all([
      this.ensureIdentityProfile(context.userId),
      this.skillsRepository.findByUserId(context.userId),
    ]);

    return toUserIdentity(updatedUser, profile, skills);
  }

  async setCollections(
    context: IdentityEngineContext,
    input: SetIdentityCollectionInput
  ): Promise<UserIdentity> {
    const user = await this.identityRepository.findUserProfile(context.userId);
    if (!user) throw new IdentityEngineError("User not found");

    const currentProfile = await this.ensureIdentityProfile(context.userId);
    const currentSkills = await this.skillsRepository.findByUserId(context.userId);

    let skills = currentSkills;
    if (input.skills !== undefined) {
      const normalized = LabeledItem.createMany(input.skills, "Skill").map(
        (item) => item.value
      );
      skills = await this.skillsRepository.replaceAll(context.userId, normalized);
    }

    const profilePatch = toIdentityProfilePatch({
      strengths: input.strengths ?? currentProfile.strengths,
      interests: input.interests ?? currentProfile.interests,
      values: input.values ?? currentProfile.values,
      personality: PersonalityProfile.create(
        (currentProfile.personality?.traits ?? []).map((trait) => ({
          name: trait.name,
          description: trait.description ?? null,
          score: trait.score ?? null,
        }))
      ),
      experience: toExperienceCollection(
        (currentProfile.experience ?? []).map((entry) => ({
          id: entry.id,
          title: entry.title,
          organization: entry.organization,
          startYear: entry.startYear,
          endYear: entry.endYear ?? null,
          description: entry.description ?? null,
        }))
      ),
    });

    const updatedProfile = await this.identityRepository.upsertIdentityProfile(
      context.userId,
      profilePatch
    );

    return toUserIdentity(user, updatedProfile, skills);
  }

  async updatePersonality(
    context: IdentityEngineContext,
    input: UpdatePersonalityInput
  ): Promise<UserIdentity> {
    const user = await this.identityRepository.findUserProfile(context.userId);
    if (!user) throw new IdentityEngineError("User not found");

    const currentProfile = await this.ensureIdentityProfile(context.userId);
    const skills = await this.skillsRepository.findByUserId(context.userId);
    const personality = PersonalityProfile.create(
      input.traits.map((trait) => ({
        name: trait.name,
        description: trait.description ?? null,
        score: trait.score ?? null,
      }))
    );

    const updatedProfile = await this.identityRepository.upsertIdentityProfile(
      context.userId,
      toIdentityProfilePatch({
        strengths: currentProfile.strengths,
        interests: currentProfile.interests,
        values: currentProfile.values,
        personality,
        experience: toExperienceCollection(
          (currentProfile.experience ?? []).map((entry) => ({
            id: entry.id,
            title: entry.title,
            organization: entry.organization,
            startYear: entry.startYear,
            endYear: entry.endYear ?? null,
            description: entry.description ?? null,
          }))
        ),
      })
    );

    return toUserIdentity(user, updatedProfile, skills);
  }

  async setExperience(
    context: IdentityEngineContext,
    entries: ExperienceEntryInput[]
  ): Promise<UserIdentity> {
    const user = await this.identityRepository.findUserProfile(context.userId);
    if (!user) throw new IdentityEngineError("User not found");

    const currentProfile = await this.ensureIdentityProfile(context.userId);
    const skills = await this.skillsRepository.findByUserId(context.userId);
    const experience = toExperienceCollection(entries);

    const updatedProfile = await this.identityRepository.upsertIdentityProfile(
      context.userId,
      toIdentityProfilePatch({
        strengths: currentProfile.strengths,
        interests: currentProfile.interests,
        values: currentProfile.values,
        personality: PersonalityProfile.create(
          (currentProfile.personality?.traits ?? []).map((trait) => ({
            name: trait.name,
            description: trait.description ?? null,
            score: trait.score ?? null,
          }))
        ),
        experience,
      })
    );

    return toUserIdentity(user, updatedProfile, skills);
  }

  private async ensureIdentityProfile(userId: string) {
    const existing = await this.identityRepository.findIdentityProfile(userId);
    if (existing) return existing;

    return this.identityRepository.upsertIdentityProfile(
      userId,
      toIdentityProfilePatch({})
    );
  }
}

export function createIdentityEngineService(
  supabase: SupabaseServerClient
): IdentityEngineService {
  return new IdentityEngineServiceImpl(
    new SupabaseIdentityRepository(supabase),
    new SupabaseUserSkillsRepository(supabase)
  );
}

export { IdentityEngineError } from "../domain/errors";
export { IdentityValidationError } from "../domain/errors";
