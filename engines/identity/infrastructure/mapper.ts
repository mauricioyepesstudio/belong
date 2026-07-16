import { UserIdentity } from "../domain/entities/user-identity";
import { Bio } from "../domain/value-objects/bio";
import { ExperienceCollection } from "../domain/value-objects/experience-entry";
import { LabeledItem } from "../domain/value-objects/labeled-item";
import { Location } from "../domain/value-objects/location";
import { Name } from "../domain/value-objects/name";
import { PersonalityProfile } from "../domain/value-objects/personality-profile";
import { Role } from "../domain/value-objects/role";
import type {
  IdentityProfileRecord,
  UpdateUserProfileRecord,
  UpsertIdentityProfileRecord,
  UserProfileRecord,
} from "../ports/identity-repository";
import type { ExperienceEntryInput } from "../types";
import { createExperienceId } from "../utils";

export function toUserIdentity(
  user: UserProfileRecord,
  profile: IdentityProfileRecord,
  skills: string[]
): UserIdentity {
  return UserIdentity.create({
    userId: user.id,
    email: user.email,
    name: Name.create(user.full_name),
    bio: Bio.create(user.bio),
    location: Location.create(user.location),
    role: Role.create(user.role),
    avatarUrl: user.avatar_url,
    skills: LabeledItem.createMany(skills, "Skill"),
    strengths: LabeledItem.createMany(profile.strengths, "Strength"),
    interests: LabeledItem.createMany(profile.interests, "Interest"),
    values: LabeledItem.createMany(profile.values, "Value"),
    personality: PersonalityProfile.create(
      (profile.personality?.traits ?? []).map((trait) => ({
        name: trait.name,
        description: trait.description ?? null,
        score: trait.score ?? null,
      }))
    ),
    experience: ExperienceCollection.create(
      (profile.experience ?? []).map((entry) => ({
        id: entry.id,
        title: entry.title,
        organization: entry.organization,
        startYear: entry.startYear,
        endYear: entry.endYear ?? null,
        description: entry.description ?? null,
      }))
    ),
    createdAt: user.created_at,
    updatedAt: profile.updated_at || user.updated_at,
  });
}

export function toUserProfilePatch(input: {
  name?: string | null;
  bio?: string | null;
  location?: string | null;
  role?: string | null;
  avatarUrl?: string | null;
}): UpdateUserProfileRecord {
  const patch: UpdateUserProfileRecord = {};

  if (input.name !== undefined) {
    patch.full_name = Name.create(input.name).value;
  }
  if (input.bio !== undefined) {
    patch.bio = Bio.create(input.bio).value;
  }
  if (input.location !== undefined) {
    patch.location = Location.create(input.location).value;
  }
  if (input.role !== undefined) {
    patch.role = Role.create(input.role).value;
  }
  if (input.avatarUrl !== undefined) {
    patch.avatar_url = input.avatarUrl;
  }

  return patch;
}

export function toIdentityProfilePatch(input: {
  strengths?: string[];
  interests?: string[];
  values?: string[];
  personality?: PersonalityProfile;
  experience?: ExperienceCollection;
}): UpsertIdentityProfileRecord {
  const strengths = input.strengths
    ? LabeledItem.createMany(input.strengths, "Strength").map((item) => item.value)
    : undefined;
  const interests = input.interests
    ? LabeledItem.createMany(input.interests, "Interest").map((item) => item.value)
    : undefined;
  const values = input.values
    ? LabeledItem.createMany(input.values, "Value").map((item) => item.value)
    : undefined;

  return {
    strengths: strengths ?? [],
    interests: interests ?? [],
    values: values ?? [],
    personality: {
      traits: (input.personality?.traits ?? []).map((trait) => ({
        name: trait.name,
        description: trait.description,
        score: trait.score,
      })),
    },
    experience: (input.experience?.entries ?? []).map((entry) => ({
      id: entry.id,
      title: entry.title,
      organization: entry.organization,
      startYear: entry.startYear,
      endYear: entry.endYear,
      description: entry.description,
    })),
  };
}

export function toExperienceCollection(
  entries: ExperienceEntryInput[]
): ExperienceCollection {
  return ExperienceCollection.create(
    entries.map((entry) => ({
      id: entry.id ?? createExperienceId(),
      title: entry.title,
      organization: entry.organization,
      startYear: entry.startYear,
      endYear: entry.endYear ?? null,
      description: entry.description ?? null,
    }))
  );
}

export function emptyIdentityProfile(userId: string): IdentityProfileRecord {
  const now = new Date().toISOString();
  return {
    user_id: userId,
    strengths: [],
    interests: [],
    values: [],
    personality: { traits: [] },
    experience: [],
    created_at: now,
    updated_at: now,
  };
}
