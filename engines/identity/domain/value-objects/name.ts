import { IDENTITY_LIMITS } from "../../constants";
import { IdentityValidationError } from "../errors";

export class Name {
  private constructor(readonly value: string | null) {}

  static create(raw: string | null | undefined): Name {
    if (raw == null || raw.trim() === "") {
      return new Name(null);
    }

    const value = raw.trim();
    if (value.length > IDENTITY_LIMITS.nameMaxLength) {
      throw new IdentityValidationError(
        `Name must be at most ${IDENTITY_LIMITS.nameMaxLength} characters`
      );
    }

    return new Name(value);
  }
}
