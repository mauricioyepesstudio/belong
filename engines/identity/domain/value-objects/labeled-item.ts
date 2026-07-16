import { IDENTITY_LIMITS } from "../../constants";
import { IdentityValidationError } from "../errors";

export class LabeledItem {
  private constructor(readonly value: string) {}

  static create(raw: string, label: string): LabeledItem {
    const value = raw.trim();
    if (!value) {
      throw new IdentityValidationError(`${label} cannot be empty`);
    }
    if (value.length > IDENTITY_LIMITS.labeledItemMaxLength) {
      throw new IdentityValidationError(
        `${label} must be at most ${IDENTITY_LIMITS.labeledItemMaxLength} characters`
      );
    }
    return new LabeledItem(value);
  }

  static createMany(rawItems: string[], label: string): LabeledItem[] {
    if (rawItems.length > IDENTITY_LIMITS.labeledItemMaxCount) {
      throw new IdentityValidationError(
        `${label} cannot exceed ${IDENTITY_LIMITS.labeledItemMaxCount} items`
      );
    }

    const seen = new Set<string>();
    const items: LabeledItem[] = [];

    for (const raw of rawItems) {
      const item = LabeledItem.create(raw, label);
      const key = item.value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
    }

    return items;
  }

  equals(other: LabeledItem): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }
}
