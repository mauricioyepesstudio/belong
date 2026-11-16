import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { FIRST_WEEK_DAYS, type FirstWeekPlan } from "../first-week";

/**
 * "Your first week" card on Home: purpose → weekly goal → circle → first
 * check-in. Pure presentation; the plan comes from buildFirstWeekPlan.
 * Renders nothing once the first week is over or every step is done.
 */
export function FirstWeekGuide({ plan, className }: { plan: FirstWeekPlan; className?: string }) {
  if (!plan.visible || !plan.next || plan.day === null) return null;

  return (
    <section
      aria-labelledby="first-week-heading"
      className={cn("rounded-2xl border border-brand/25 bg-bg-elevated p-5 shadow-sm", className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="first-week-heading" className="text-sm font-semibold text-fg-primary">
          Your first week
        </h2>
        <p className="text-xs text-fg-muted">
          Day {plan.day} of {FIRST_WEEK_DAYS} · {plan.completed} of {plan.total} done
        </p>
      </div>

      <ol className="mt-4 space-y-2">
        {plan.steps.map((step) => {
          const isNext = step.id === plan.next?.id;
          return (
            <li key={step.id} className="flex items-start gap-3">
              {step.done ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
              ) : (
                <Circle
                  className={cn("mt-0.5 h-4 w-4 shrink-0", isNext ? "text-brand" : "text-fg-faint")}
                  aria-hidden
                />
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm",
                    step.done ? "text-fg-muted line-through" : "font-medium text-fg-primary"
                  )}
                >
                  {step.title}
                  <span className="sr-only">{step.done ? " (done)" : ""}</span>
                </p>
                {isNext && <p className="mt-0.5 text-xs text-fg-muted">{step.description}</p>}
              </div>
            </li>
          );
        })}
      </ol>

      <Link
        href={plan.next.href}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
      >
        Next: {plan.next.title} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </section>
  );
}
