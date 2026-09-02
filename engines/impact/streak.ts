/**
 * Momento Belong streak v1 — a daily check-in streak computed from existing
 * social posting activity, same "compute-on-read" architecture as Belong
 * Score (see belong-score.ts): no new table, no persisted column, the
 * result is derived fresh from raw activity data every time it's read.
 *
 * A "check-in day" is any calendar day (UTC) on which the user created at
 * least one social_posts row. See streak-data.ts for the Supabase query
 * that produces the `checkInDates` input to computeStreak below.
 */

export interface StreakResult {
  /** Consecutive check-in days ending today or yesterday, 0 if broken. */
  currentStreak: number;
  /** The longest such run ever observed in the supplied check-in dates. */
  longestStreak: number;
  /** Whether the current streak's run relied on a grace day within the last 7 calendar days. */
  usedGraceThisWeek: boolean;
}

/** Milliseconds in a calendar day, used to convert dates to day-number integers. */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** One missed day is forgiven per any rolling 7-day window (see walkStreak). */
const GRACE_WINDOW_DAYS = 7;

/**
 * Converts a "YYYY-MM-DD" string to an integer day number (days since the
 * Unix epoch, UTC). Using integers instead of Date objects for the walk
 * keeps the backward-stepping arithmetic in computeStreak/walkStreak exact
 * and trivially comparable, with no timezone or DST ambiguity.
 */
function toDayNumber(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

interface WalkResult {
  /** Count of actual check-in days included in the run (grace gap days themselves don't count). */
  length: number;
  /** Whether a grace day was used anywhere in this run. */
  usedGrace: boolean;
  /** Day number of the most recent (i.e. latest/closest-to-anchor) grace day used, if any. */
  lastGraceDay: number | null;
}

/**
 * Walks backward day-by-day from `anchor` (inclusive), counting consecutive
 * check-in days. Implements the "one grace day per rolling 7-day window"
 * rule:
 *
 *   - A missing day is forgiven (the walk continues past it without
 *     breaking the streak) as long as no other grace day has been used
 *     within the last GRACE_WINDOW_DAYS days.
 *   - If a second missing day falls within GRACE_WINDOW_DAYS of the most
 *     recently used grace day, the streak is considered broken there and
 *     the walk stops — that gap and everything before it is excluded from
 *     this run.
 *   - The walk never invents gaps beyond the earliest date present in the
 *     input data (`minDay`): once the cursor moves before the oldest known
 *     check-in date, we simply have no data to judge a gap on, so the walk
 *     stops cleanly instead of treating "no data" as "missed days".
 */
function walkStreak(checkInDays: Set<number>, minDay: number, anchor: number): WalkResult {
  let length = 0;
  let usedGrace = false;
  let lastGraceDay: number | null = null;
  let cursor = anchor;

  while (cursor >= minDay) {
    if (checkInDays.has(cursor)) {
      length++;
      cursor--;
      continue;
    }

    // `cursor` is a gap day (no check-in, but still within the known data range).
    const graceAvailable =
      lastGraceDay === null || lastGraceDay - cursor >= GRACE_WINDOW_DAYS;

    if (graceAvailable) {
      usedGrace = true;
      lastGraceDay = cursor;
      cursor--;
      continue;
    }

    // Second gap within the same 7-day window as the last grace day: streak breaks here.
    break;
  }

  return { length, usedGrace, lastGraceDay };
}

/**
 * Pure function: derives current/longest streak + grace usage from a list
 * of check-in dates and an explicitly-injected "today". No I/O, no
 * `new Date()` calls — fully deterministic and unit-testable.
 */
export function computeStreak(checkInDates: string[], today: string): StreakResult {
  const checkInDays = new Set(checkInDates.map(toDayNumber));

  if (checkInDays.size === 0) {
    return { currentStreak: 0, longestStreak: 0, usedGraceThisWeek: false };
  }

  const minDay = Math.min(...checkInDays);
  const todayNum = toDayNumber(today);

  // Current streak anchors on today if the user has already checked in
  // today; otherwise it anchors on yesterday so the streak doesn't look
  // broken the instant the user wakes up before posting. If neither today
  // nor yesterday has a check-in, the streak is reset to 0.
  let anchor: number | null = null;
  if (checkInDays.has(todayNum)) {
    anchor = todayNum;
  } else if (checkInDays.has(todayNum - 1)) {
    anchor = todayNum - 1;
  }

  let currentStreak = 0;
  let usedGraceThisWeek = false;

  if (anchor !== null) {
    const result = walkStreak(checkInDays, minDay, anchor);
    currentStreak = result.length;
    // "This week" is scoped to the last 7 calendar days counting back from
    // `today` (not just "anywhere in the run"), matching the field name.
    usedGraceThisWeek =
      result.usedGrace &&
      result.lastGraceDay !== null &&
      todayNum - result.lastGraceDay < GRACE_WINDOW_DAYS;
  }

  // Longest streak: try every check-in day as a potential run-ending anchor
  // and keep the best length. This correctly finds runs that are longer
  // than the current one (e.g. an older, longer streak that has since
  // lapsed) while still respecting the same grace-window rules per run.
  let longestStreak = currentStreak;
  for (const day of checkInDays) {
    const { length } = walkStreak(checkInDays, minDay, day);
    if (length > longestStreak) {
      longestStreak = length;
    }
  }

  return { currentStreak, longestStreak, usedGraceThisWeek };
}
