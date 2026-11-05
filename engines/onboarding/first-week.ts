/**
 * First guided week: from purpose to a weekly goal, then to a first week
 * of real follow-through (a check-in inside a circle). Pure and RSC-safe:
 * callers read the facts, this decides which step comes next.
 * Plan point 5 in docs/cerebro/vision-proposito.md.
 */

export const FIRST_WEEK_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export type FirstWeekStepId = "purpose" | "weekly_goal" | "circle" | "checkin";

export type FirstWeekStep = {
  id: FirstWeekStepId;
  title: string;
  description: string;
  href: string;
  done: boolean;
};

export type FirstWeekInput = {
  /** When the account was created (ISO string). */
  joinedAt: string;
  hasMission: boolean;
  hasWeeklyGoal: boolean;
  /** Active member (or creator) of at least one circle. */
  inCircle: boolean;
  /** Posted at least one circle check-in. */
  hasCheckin: boolean;
};

export type FirstWeekPlan = {
  steps: FirstWeekStep[];
  completed: number;
  total: number;
  /** First step not yet done, or null when the week is complete. */
  next: FirstWeekStep | null;
  /** 1-based day of the first week; null once the week is over or joinedAt is invalid. */
  day: number | null;
  /** Whether to show the guide: inside the first week and not finished. */
  visible: boolean;
};

export function buildFirstWeekPlan(input: FirstWeekInput, now: Date = new Date()): FirstWeekPlan {
  const steps: FirstWeekStep[] = [
    {
      id: "purpose",
      title: "Name what you are building",
      description: "Your life mission is the why behind every week.",
      href: "/missions",
      done: input.hasMission,
    },
    {
      id: "weekly_goal",
      title: "Set this week's goal",
      description: "One concrete thing you will finish in the next seven days.",
      href: "/missions",
      done: input.hasWeeklyGoal,
    },
    {
      id: "circle",
      title: "Join or start a circle",
      description: "A small group that checks in with you every week.",
      href: "/circles",
      done: input.inCircle,
    },
    {
      id: "checkin",
      title: "Post your first check-in",
      description: "Tell your circle what moved and what is next.",
      href: "/circles",
      done: input.hasCheckin,
    },
  ];

  const completed = steps.filter((step) => step.done).length;
  const next = steps.find((step) => !step.done) ?? null;

  const joined = new Date(input.joinedAt).getTime();
  const elapsedDays = Number.isNaN(joined) ? null : Math.floor((now.getTime() - joined) / DAY_MS);
  const day =
    elapsedDays !== null && elapsedDays >= 0 && elapsedDays < FIRST_WEEK_DAYS ? elapsedDays + 1 : null;

  return {
    steps,
    completed,
    total: steps.length,
    next,
    day,
    visible: day !== null && next !== null,
  };
}
