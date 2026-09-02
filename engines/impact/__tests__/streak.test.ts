import { describe, expect, it } from "vitest";
import { computeStreak } from "@/engines/impact/streak";

describe("computeStreak", () => {
  it("returns all zeros when there are no check-ins at all", () => {
    const result = computeStreak([], "2026-01-10");

    expect(result).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      usedGraceThisWeek: false,
    });
  });

  it("counts a single check-in today as a streak of 1", () => {
    const result = computeStreak(["2026-01-10"], "2026-01-10");

    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.usedGraceThisWeek).toBe(false);
  });

  it("counts a consecutive run of 5 days ending today", () => {
    const dates = ["2026-01-06", "2026-01-07", "2026-01-08", "2026-01-09", "2026-01-10"];

    const result = computeStreak(dates, "2026-01-10");

    expect(result.currentStreak).toBe(5);
    expect(result.longestStreak).toBe(5);
    expect(result.usedGraceThisWeek).toBe(false);
  });

  it("preserves the streak across exactly one gap within a 7-day window (grace used)", () => {
    // Check-ins on 01-04, 05, 06, [gap 07], 08, 09, 10 -- one missed day.
    const dates = [
      "2026-01-04",
      "2026-01-05",
      "2026-01-06",
      "2026-01-08",
      "2026-01-09",
      "2026-01-10",
    ];

    const result = computeStreak(dates, "2026-01-10");

    // All 6 check-in days count; the single gap day is forgiven, not counted.
    expect(result.currentStreak).toBe(6);
    expect(result.usedGraceThisWeek).toBe(true);
  });

  it("breaks the streak at a second gap within the same 7-day window", () => {
    // Check-ins on 01, [gap 02], 03, [gap 04], 05, 06, 07 relative anchor day 07.
    // First gap (day 02) is forgiven; second gap (day 04) falls within 7 days
    // of the first grace day, so the streak breaks there.
    const dates = ["2026-01-01", "2026-01-03", "2026-01-05", "2026-01-06", "2026-01-07"];

    const result = computeStreak(dates, "2026-01-07");

    // Walking back from 07: 07,06,05 count (3), gap at 04 uses grace,
    // then gap at 03... wait 03 is a check-in day, so let's verify precisely
    // via the actual walk rather than prose -- see assertion below.
    expect(result.currentStreak).toBe(4);
    expect(result.usedGraceThisWeek).toBe(true);
  });

  it("keeps the streak current when the user checked in yesterday but not yet today", () => {
    const dates = ["2026-01-08", "2026-01-09"];

    const result = computeStreak(dates, "2026-01-10");

    expect(result.currentStreak).toBe(2);
    expect(result.usedGraceThisWeek).toBe(false);
  });

  it("resets the streak to 0 when the last check-in was 3+ days ago", () => {
    const dates = ["2026-01-05", "2026-01-06", "2026-01-07"];

    const result = computeStreak(dates, "2026-01-10");

    expect(result.currentStreak).toBe(0);
    expect(result.usedGraceThisWeek).toBe(false);
    // The historic run is still reflected in longestStreak.
    expect(result.longestStreak).toBe(3);
  });

  it("tracks longestStreak from a past run even when the current run is shorter", () => {
    // A long past run of 6 days, then a lapse, then a fresh short run of 2
    // days ending today.
    const dates = [
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
      "2026-01-05",
      "2026-01-06",
      // gap 01-07 through 01-08 (2+ missed days, breaks the streak entirely)
      "2026-01-09",
      "2026-01-10",
    ];

    const result = computeStreak(dates, "2026-01-10");

    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(6);
  });
});
