import { describe, expect, it } from "vitest";
import { FIRST_WEEK_DAYS, buildFirstWeekPlan, type FirstWeekInput } from "../first-week";

const NOW = new Date("2026-11-05T15:00:00Z");

const fresh: FirstWeekInput = {
  joinedAt: "2026-11-05T10:00:00Z",
  hasMission: false,
  hasWeeklyGoal: false,
  inCircle: false,
  hasCheckin: false,
};

describe("buildFirstWeekPlan", () => {
  it("starts on day 1 with purpose as the next step", () => {
    const plan = buildFirstWeekPlan(fresh, NOW);
    expect(plan.day).toBe(1);
    expect(plan.completed).toBe(0);
    expect(plan.total).toBe(4);
    expect(plan.next?.id).toBe("purpose");
    expect(plan.visible).toBe(true);
  });

  it("moves to the circle step after onboarding created a mission and a goal", () => {
    const plan = buildFirstWeekPlan({ ...fresh, hasMission: true, hasWeeklyGoal: true }, NOW);
    expect(plan.completed).toBe(2);
    expect(plan.next?.id).toBe("circle");
  });

  it("points to the first check-in once the person is in a circle", () => {
    const plan = buildFirstWeekPlan(
      { ...fresh, hasMission: true, hasWeeklyGoal: true, inCircle: true },
      NOW
    );
    expect(plan.next?.id).toBe("checkin");
    expect(plan.next?.href).toBe("/circles");
  });

  it("hides the guide when every step is done", () => {
    const plan = buildFirstWeekPlan(
      { ...fresh, hasMission: true, hasWeeklyGoal: true, inCircle: true, hasCheckin: true },
      NOW
    );
    expect(plan.next).toBeNull();
    expect(plan.completed).toBe(4);
    expect(plan.visible).toBe(false);
  });

  it("counts days from the join date and hides after the first week", () => {
    const day7 = buildFirstWeekPlan({ ...fresh, joinedAt: "2026-10-29T16:00:00Z" }, NOW);
    expect(day7.day).toBe(FIRST_WEEK_DAYS);
    expect(day7.visible).toBe(true);

    const day8 = buildFirstWeekPlan({ ...fresh, joinedAt: "2026-10-29T14:00:00Z" }, NOW);
    expect(day8.day).toBeNull();
    expect(day8.visible).toBe(false);
  });

  it("hides the guide for an invalid or future join date", () => {
    expect(buildFirstWeekPlan({ ...fresh, joinedAt: "not a date" }, NOW).visible).toBe(false);
    expect(buildFirstWeekPlan({ ...fresh, joinedAt: "2026-11-06T10:00:00Z" }, NOW).visible).toBe(false);
  });
});
