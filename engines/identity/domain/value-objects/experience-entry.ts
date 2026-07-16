import { IDENTITY_LIMITS } from "../../constants";
import { IdentityValidationError } from "../errors";

export type ExperienceEntry = {
  id: string;
  title: string;
  organization: string;
  startYear: number;
  endYear: number | null;
  description: string | null;
};

export class ExperienceCollection {
  private constructor(readonly entries: readonly ExperienceEntry[]) {}

  static empty(): ExperienceCollection {
    return new ExperienceCollection([]);
  }

  static create(rawEntries: ExperienceEntry[]): ExperienceCollection {
    if (rawEntries.length > IDENTITY_LIMITS.experienceMaxCount) {
      throw new IdentityValidationError(
        `Experience cannot exceed ${IDENTITY_LIMITS.experienceMaxCount} entries`
      );
    }

    const entries = rawEntries.map((raw) => {
      const title = raw.title.trim();
      const organization = raw.organization.trim();

      if (!title) {
        throw new IdentityValidationError("Experience title cannot be empty");
      }
      if (!organization) {
        throw new IdentityValidationError("Experience organization cannot be empty");
      }
      if (title.length > IDENTITY_LIMITS.experienceTitleMaxLength) {
        throw new IdentityValidationError(
          `Experience title must be at most ${IDENTITY_LIMITS.experienceTitleMaxLength} characters`
        );
      }
      if (organization.length > IDENTITY_LIMITS.experienceOrganizationMaxLength) {
        throw new IdentityValidationError(
          `Experience organization must be at most ${IDENTITY_LIMITS.experienceOrganizationMaxLength} characters`
        );
      }

      const currentYear = new Date().getFullYear() + 1;
      if (raw.startYear < 1900 || raw.startYear > currentYear) {
        throw new IdentityValidationError("Experience start year is invalid");
      }

      if (raw.endYear != null) {
        if (raw.endYear < raw.startYear || raw.endYear > currentYear) {
          throw new IdentityValidationError("Experience end year is invalid");
        }
      }

      const description = raw.description?.trim() || null;
      if (
        description &&
        description.length > IDENTITY_LIMITS.experienceDescriptionMaxLength
      ) {
        throw new IdentityValidationError(
          `Experience description must be at most ${IDENTITY_LIMITS.experienceDescriptionMaxLength} characters`
        );
      }

      return {
        id: raw.id,
        title,
        organization,
        startYear: raw.startYear,
        endYear: raw.endYear ?? null,
        description,
      };
    });

    return new ExperienceCollection(entries);
  }
}
