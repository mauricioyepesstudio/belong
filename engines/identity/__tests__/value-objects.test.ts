import { describe, expect, it } from "vitest";
import { LabeledItem } from "../domain/value-objects/labeled-item";
import { Name } from "../domain/value-objects/name";
import { PersonalityProfile } from "../domain/value-objects/personality-profile";
import { ExperienceCollection } from "../domain/value-objects/experience-entry";
import { IdentityValidationError } from "../domain/errors";

describe("Name", () => {
  it("accepts valid names and trims whitespace", () => {
    const name = Name.create("  Alex Rivera  ");
    expect(name.value).toBe("Alex Rivera");
  });

  it("allows empty names as null", () => {
    expect(Name.create("").value).toBeNull();
    expect(Name.create(null).value).toBeNull();
  });

  it("rejects names that exceed the limit", () => {
    expect(() => Name.create("a".repeat(121))).toThrow(IdentityValidationError);
  });
});

describe("LabeledItem", () => {
  it("deduplicates items case-insensitively", () => {
    const items = LabeledItem.createMany(["Leadership", "leadership", "Design"], "Skill");
    expect(items.map((item) => item.value)).toEqual(["Leadership", "Design"]);
  });

  it("rejects empty collection entries", () => {
    expect(() => LabeledItem.create("   ", "Strength")).toThrow(IdentityValidationError);
  });
});

describe("PersonalityProfile", () => {
  it("validates trait scores", () => {
    expect(() =>
      PersonalityProfile.create([{ name: "Curiosity", score: 6, description: null }])
    ).toThrow(IdentityValidationError);

    const profile = PersonalityProfile.create([
      { name: "Curiosity", score: 4, description: "Asks why" },
    ]);

    expect(profile.traits).toHaveLength(1);
    expect(profile.traits[0]?.score).toBe(4);
  });
});

describe("ExperienceCollection", () => {
  it("rejects invalid year ranges", () => {
    expect(() =>
      ExperienceCollection.create([
        {
          id: "exp-1",
          title: "Engineer",
          organization: "BELONG",
          startYear: 2024,
          endYear: 2020,
          description: null,
        },
      ])
    ).toThrow(IdentityValidationError);
  });
});
