import { cn } from "@/lib/utils";
import { Flame, Sparkles, Trophy } from "lucide-react";

export type StreakBadgeProps = {
  currentStreak: number;
  longestStreak: number;
  usedGraceThisWeek: boolean;
  className?: string;
};

/**
 * Momento Belong streak indicator — the visual "momentum" signal shown
 * alongside the dashboard. Deliberately uses the amber `warning` design
 * token (not the violet brand color) so it reads as its own reward signal,
 * distinct from the rest of the UI. Pure presentation: all streak math
 * lives in engines/impact/streak(-data).ts.
 */
export function StreakBadge({
  currentStreak,
  longestStreak,
  usedGraceThisWeek,
  className,
}: StreakBadgeProps) {
  const isActive = currentStreak > 0;
  const isRecord = isActive && currentStreak >= longestStreak && longestStreak > 1;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-bg-elevated p-5 shadow-sm",
        isActive ? "border-warning/25" : "border-border",
        className
      )}
    >
      {isActive && (
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 animate-pulse rounded-full bg-warning/20 blur-3xl motion-reduce:animate-none"
          aria-hidden
        />
      )}

      <div className="relative flex items-center gap-4">
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border",
            isActive
              ? "border-warning/30 bg-gradient-to-br from-warning/25 to-warning/5 text-warning"
              : "border-border-subtle bg-bg-hover text-fg-faint"
          )}
        >
          <Flame
            className={cn(
              "h-7 w-7",
              isActive && "animate-pulse motion-reduce:animate-none"
            )}
            strokeWidth={isActive ? 2 : 1.5}
            aria-hidden
          />
        </div>

        <div className="min-w-0 flex-1">
          {isActive ? (
            <>
              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                <span className="text-3xl font-semibold tracking-tight text-fg-primary">
                  {currentStreak}
                </span>
                <span className="text-sm font-medium text-fg-secondary">
                  day momentum streak
                </span>
              </div>
              <p className="mt-1 text-xs text-fg-muted">
                {isRecord
                  ? "Your longest streak yet — keep it going."
                  : `Best: ${longestStreak} day${longestStreak === 1 ? "" : "s"}`}
              </p>
              {usedGraceThisWeek && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-warning/20 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Grace day used this week
                </span>
              )}
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-fg-primary">
                Start your momentum streak
              </p>
              <p className="mt-1 text-xs text-fg-muted">
                Share something in your feed today to begin building consistency.
              </p>
            </>
          )}
        </div>

        {isRecord && (
          <Trophy className="h-4 w-4 shrink-0 text-warning/70" aria-hidden />
        )}
      </div>
    </div>
  );
}
