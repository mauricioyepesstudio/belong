/**
 * "Live circles" -- BELONG's north-star metric (docs/cerebro/vision-proposito.md):
 * a circle with at least 3 active members that has had a check-in in each of
 * the last 4 consecutive weeks. Pure functions only, so the metric can be
 * computed from whatever rows a caller already read.
 */

export const LIVE_CIRCLE_MIN_MEMBERS = 3;
export const LIVE_CIRCLE_MIN_WEEKS = 4;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Monday-based UTC week number (1970-01-01 was a Thursday, hence the +3). */
function weekIndex(date: Date): number {
  return Math.floor((Math.floor(date.getTime() / DAY_MS) + 3) / 7);
}

/**
 * Consecutive weeks with at least one check-in, counted back from the current
 * week. A streak still counts if this week has no check-in yet but last week
 * did, so a circle is not "dead" on Monday morning.
 */
export function checkinStreakWeeks(checkinDates: string[], now: Date = new Date()): number {
  const weeks = new Set(
    checkinDates.map((d) => new Date(d)).filter((d) => !Number.isNaN(d.getTime())).map(weekIndex)
  );
  let week = weekIndex(now);
  if (!weeks.has(week)) week -= 1;
  let streak = 0;
  while (weeks.has(week - streak)) streak += 1;
  return streak;
}

export type CircleVitalityInput = {
  activeMemberCount: number;
  checkinDates: string[];
};

export function isLiveCircle(circle: CircleVitalityInput, now: Date = new Date()): boolean {
  return (
    circle.activeMemberCount >= LIVE_CIRCLE_MIN_MEMBERS &&
    checkinStreakWeeks(circle.checkinDates, now) >= LIVE_CIRCLE_MIN_WEEKS
  );
}

export function countLiveCircles(circles: CircleVitalityInput[], now: Date = new Date()): number {
  return circles.filter((circle) => isLiveCircle(circle, now)).length;
}
