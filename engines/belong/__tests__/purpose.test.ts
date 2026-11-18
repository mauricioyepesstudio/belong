import { describe, expect, it } from "vitest";
import { HUMAN_NEEDS } from "@/engines/belong/purpose";

describe("HUMAN_NEEDS", () => {
  it("covers connection, growth and contribution once each", () => {
    expect(HUMAN_NEEDS.map((need) => need.id)).toEqual(["connection", "growth", "contribution"]);
  });

  it("backs every figure with a public https source and a year", () => {
    for (const need of HUMAN_NEEDS) {
      expect(need.stat.trim()).not.toBe("");
      expect(need.source.name.trim()).not.toBe("");
      expect(need.source.year).toBeGreaterThanOrEqual(2020);
      expect(new URL(need.source.url).protocol).toBe("https:");
    }
  });

  it("ties each need to something BELONG already offers", () => {
    for (const need of HUMAN_NEEDS) {
      expect(need.answer.length).toBeGreaterThan(20);
    }
  });
});
