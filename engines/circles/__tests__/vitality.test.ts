import { describe, expect, it } from "vitest";
import { checkinStreakWeeks, countLiveCircles, isLiveCircle } from "../vitality";

// Monday 2026-10-26, mid-day UTC.
const now = new Date("2026-10-26T15:00:00Z");
// One check-in in each of the 4 weeks ending with the week of 2026-10-19.
const fourPastWeeks = [
  "2026-10-23T10:00:00Z",
  "2026-10-14T10:00:00Z",
  "2026-10-06T10:00:00Z",
  "2026-09-28T00:00:00Z",
];

describe("checkinStreakWeeks", () => {
  it("is 0 with no check-ins", () => {
    expect(checkinStreakWeeks([], now)).toBe(0);
  });

  it("keeps last week's streak when this week has no check-in yet", () => {
    expect(checkinStreakWeeks(fourPastWeeks, now)).toBe(4);
  });

  it("adds this week when it already has a check-in", () => {
    expect(checkinStreakWeeks(["2026-10-26T09:00:00Z", ...fourPastWeeks], now)).toBe(5);
  });

  it("counts several check-ins in one week once", () => {
    expect(checkinStreakWeeks(["2026-10-20T08:00:00Z", "2026-10-25T23:59:00Z"], now)).toBe(1);
  });

  it("stops at a missing week", () => {
    expect(checkinStreakWeeks(["2026-10-23T10:00:00Z", "2026-10-06T10:00:00Z"], now)).toBe(1);
  });

  it("is 0 when the last check-in is two weeks old", () => {
    expect(checkinStreakWeeks(["2026-10-14T10:00:00Z"], now)).toBe(0);
  });

  it("ignores unparseable dates", () => {
    expect(checkinStreakWeeks(["not-a-date", "2026-10-23T10:00:00Z"], now)).toBe(1);
  });
});

describe("isLiveCircle", () => {
  it("needs at least 3 active members", () => {
    expect(isLiveCircle({ activeMemberCount: 2, checkinDates: fourPastWeeks }, now)).toBe(false);
    expect(isLiveCircle({ activeMemberCount: 3, checkinDates: fourPastWeeks }, now)).toBe(true);
  });

  it("needs 4 consecutive weeks of check-ins", () => {
    expect(
      isLiveCircle({ activeMemberCount: 5, checkinDates: fourPastWeeks.slice(0, 3) }, now)
    ).toBe(false);
  });
});

describe("countLiveCircles", () => {
  it("counts only live circles", () => {
    expect(
      countLiveCircles(
        [
          { activeMemberCount: 3, checkinDates: fourPastWeeks },
          { activeMemberCount: 1, checkinDates: fourPastWeeks },
          { activeMemberCount: 4, checkinDates: [] },
        ],
        now
      )
    ).toBe(1);
  });
});
