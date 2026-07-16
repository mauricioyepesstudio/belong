import { IDENTITY_LIMITS } from "../../constants";
import { IdentityValidationError } from "../errors";

export class Role {
  private constructor(readonly value: string | null) {}

  static create(raw: string | null | undefined): Role {
    if (raw == null || raw.trim() === "") {
      return new Role(null);
    }

    const value = raw.trim();
    if (value.length > IDENTITY_LIMITS.roleMaxLength) {
      throw new IdentityValidationError(
        `Role must be at most ${IDENTITY_LIMITS.roleMaxLength} characters`
      );
    }

    return new Role(value);
  }
}
