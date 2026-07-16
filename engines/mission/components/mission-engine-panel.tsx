"use client";

import { completeDailyMission } from "@/lib/actions/mission-engine";
import type { MissionEngineData } from "@/engines/mission/types";
import { Badge, Button, Card, CardContent, ProgressBar, useToast } from "@/systems/design-system";
import { cn } from "@/lib/utils";
import { Check, Flame, Target } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function MissionEnginePanel({ data }: { data: MissionEngineData }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const complete = (id: string) => {
    startTransition(async () => {
      const result = await completeDailyMission(id);
      if (result.error) toast(result.error, "error");
      else {
        toast("Mission complete", "success");
        router.refresh();
      }
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-brand" aria-hidden />
            <h2 className="text-sm font-semibold text-fg-primary">Mission Engine</h2>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-400" aria-hidden />
            <span className="text-sm font-medium">{data.momentum.current_streak} day streak</span>
          </div>
        </div>

        <p className="mb-4 text-xs text-fg-muted">
          Today: {data.dailyCompleted}/{data.dailyTotal} missions · Weekly: {data.weeklyProgress}%
        </p>

        <ul className="space-y-2">
          {data.dailyMissions.map((mission) => (
            <li
              key={mission.id}
              className={cn(
                "rounded-xl border p-3 transition-colors",
                mission.status === "completed"
                  ? "border-success/20 bg-success/5 opacity-75"
                  : "border-border-subtle hover:border-border-strong"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-fg-primary">{mission.title}</p>
                  {mission.description && (
                    <p className="mt-0.5 text-xs text-fg-muted">{mission.description}</p>
                  )}
                  <Badge variant="outline" className="mt-2">
                    +{mission.impact_points} impact
                  </Badge>
                </div>
                {mission.status === "completed" ? (
                  <Check className="h-5 w-5 shrink-0 text-success" aria-hidden />
                ) : (
                  <Button
                    size="sm"
                    variant="brand"
                    disabled={isPending}
                    onClick={() => complete(mission.id)}
                  >
                    Done
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {data.weeklyGoals.length > 0 && (
          <div className="mt-6 border-t border-border-subtle pt-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-fg-muted">
              Weekly goals
            </p>
            {data.weeklyGoals.map((goal) => (
              <div key={goal.id} className="mb-3 last:mb-0">
                <div className="flex justify-between text-sm">
                  <Link href={goal.action_href} className="font-medium text-fg-primary hover:text-brand">
                    {goal.title}
                  </Link>
                  <span className="text-fg-muted">
                    {goal.current_count}/{goal.target_count}
                  </span>
                </div>
                <ProgressBar
                  value={Math.round((goal.current_count / goal.target_count) * 100)}
                  className="mt-2"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
