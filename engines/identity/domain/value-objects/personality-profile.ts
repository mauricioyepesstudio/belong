import { IDENTITY_LIMITS } from "../../constants";
import { IdentityValidationError } from "../errors";

export type PersonalityTrait = {
  name: string;
  description: string | null;
  score: number | null;
};

export class PersonalityProfile {
  private constructor(readonly traits: readonly PersonalityTrait[]) {}

  static empty(): PersonalityProfile {
    return new PersonalityProfile([]);
  }

  static create(rawTraits: PersonalityTrait[]): PersonalityProfile {
    if (rawTraits.length > IDENTITY_LIMITS.personalityTraitMaxCount) {
      throw new IdentityValidationError(
        `Personality cannot exceed ${IDENTITY_LIMITS.personalityTraitMaxCount} traits`
      );
    }

    const seen = new Set<string>();
    const traits: PersonalityTrait[] = [];

    for (const raw of rawTraits) {
      const name = raw.name.trim();
      if (!name) {
        throw new IdentityValidationError("Personality trait name cannot be empty");
      }
      if (name.length > IDENTITY_LIMITS.personalityTraitMaxLength) {
        throw new IdentityValidationError(
          `Personality trait name must be at most ${IDENTITY_LIMITS.personalityTraitMaxLength} characters`
        );
      }

      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      let score: number | null = null;
      if (raw.score != null) {
        if (
          raw.score < IDENTITY_LIMITS.personalityScoreMin ||
          raw.score > IDENTITY_LIMITS.personalityScoreMax
        ) {
          throw new IdentityValidationError(
            `Personality score must be between ${IDENTITY_LIMITS.personalityScoreMin} and ${IDENTITY_LIMITS.personalityScoreMax}`
          );
        }
        score = raw.score;
      }

      traits.push({
        name,
        description: raw.description?.trim() || null,
        score,
      });
    }

    return new PersonalityProfile(traits);
  }
}
