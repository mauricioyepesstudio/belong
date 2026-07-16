import { IDENTITY_LIMITS } from "../../constants";
import { IdentityValidationError } from "../errors";

export class Bio {
  private constructor(readonly value: string | null) {}

  static create(raw: string | null | undefined): Bio {
    if (raw == null || raw.trim() === "") {
      return new Bio(null);
    }

    const value = raw.trim();
    if (value.length > IDENTITY_LIMITS.bioMaxLength) {
      throw new IdentityValidationError(
        `Bio must be at most ${IDENTITY_LIMITS.bioMaxLength} characters`
      );
    }

    return new Bio(value);
  }
}
