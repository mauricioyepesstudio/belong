import { describe, expect, it } from "vitest";
import {
  aggregateImpactScores,
  monthStartIso,
  weekStartIso,
} from "@/engines/impact/service";

describe("aggregateImpactScores", () => {
  const now = new Date("2026-07-21T15:00:00.000Z");

  it("returns zero totals for empty events", () => {
    expect(aggregateImpactScores([], now)).toEqual({
      totalScore: 0,
      weeklyScore: 0,
      monthlyScore: 0,
    });
  });

  it("sums lifetime, weekly, and monthly totals", () => {
    const rows = [
      { points: 5, created_at: "2026-06-01T12:00:00.000Z" },
      { points: 3, created_at: "2026-07-20T12:00:00.000Z" },
      { points: 2, created_at: "2026-07-21T14:00:00.000Z" },
    ];

    expect(aggregateImpactScores(rows, now)).toEqual({
      totalScore: 10,
      weeklyScore: 5,
      monthlyScore: 5,
    });
  });

  it("uses UTC Monday as week start", () => {
    const monday = new Date("2026-07-20T00:00:00.000Z");
    expect(weekStartIso(monday)).toBe("2026-07-20T00:00:00.000Z");

    const sunday = new Date("2026-07-19T23:59:00.000Z");
    expect(weekStartIso(sunday)).toBe("2026-07-13T00:00:00.000Z");
  });

  it("uses UTC month start", () => {
    expect(monthStartIso(now)).toBe("2026-07-01T00:00:00.000Z");
  });
});
