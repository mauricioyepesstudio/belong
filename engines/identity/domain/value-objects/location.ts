import { IDENTITY_LIMITS } from "../../constants";
import { IdentityValidationError } from "../errors";

export class Location {
  private constructor(readonly value: string | null) {}

  static create(raw: string | null | undefined): Location {
    if (raw == null || raw.trim() === "") {
      return new Location(null);
    }

    const value = raw.trim();
    if (value.length > IDENTITY_LIMITS.locationMaxLength) {
      throw new IdentityValidationError(
        `Location must be at most ${IDENTITY_LIMITS.locationMaxLength} characters`
      );
    }

    return new Location(value);
  }
}
