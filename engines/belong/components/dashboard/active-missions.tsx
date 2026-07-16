"use client";

import { completeDailyMission } from "@/lib/actions/mission-engine";
import type { HomeEngineData } from "@/engines/belong/data";
import { ScrollReveal } from "@/components/motion/fade-in";
import { Badge, Button, EmptyState, useToast } from "@/systems/design-system";
import { ArrowRight, Check, Target, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { GlassCard, SectionHeader } from "./primitives";

export function ActiveMissions({
  missionEngine,
  onNewMission,
}: {
  missionEngine: HomeEngineData["missionEngine"];
  onNewMission: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const active = missionEngine.dailyMissions.filter((m) => m.status === "pending");

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
    <ScrollReveal delay={0.05}>
      <section>
        <SectionHeader
          label="Missions"
          title="Today's missions"
          action={
            <Button variant="ghost" size="sm" onClick={onNewMission} className="text-fg-muted hover:text-brand">
              <Zap className="h-4 w-4" aria-hidden />
              New mission
            </Button>
          }
        />

        {active.length === 0 ? (
          <GlassCard>
            <EmptyState
              icon={Target}
              title="No active missions"
              description="Create a mission to track what you're working on today, or explore communities to unlock daily missions."
              action={{ label: "New mission", onClick: onNewMission }}
              className="border-0 bg-transparent py-12"
            />
          </GlassCard>
        ) : (
          <ul className="space-y-3">
            {active.map((mission) => (
              <li key={mission.id}>
                <GlassCard hover className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-fg-primary">{mission.title}</p>
                      {mission.description && (
                        <p className="mt-1 text-sm text-fg-muted">{mission.description}</p>
                      )}
                      <Badge variant="outline" className="mt-3">
                        +{mission.impact_points} impact
                      </Badge>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Link href={mission.action_href}>
                        <Button variant="outline" size="sm" className="rounded-xl">
                          Start
                          <ArrowRight className="h-4 w-4" aria-hidden />
                        </Button>
                      </Link>
                      <Button
                        variant="brand"
                        size="sm"
                        className="rounded-xl"
                        disabled={isPending}
                        onClick={() => complete(mission.id)}
                      >
                        <Check className="h-4 w-4" aria-hidden />
                        Done
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </li>
            ))}
          </ul>
        )}

        {missionEngine.dailyMissions.some((m) => m.status === "completed") && (
          <p className="mt-4 text-center text-micro text-fg-faint">
            {missionEngine.dailyCompleted}/{missionEngine.dailyTotal} completed today
            {missionEngine.momentum.current_streak > 0 &&
              ` · ${missionEngine.momentum.current_streak} day streak`}
          </p>
        )}
      </section>
    </ScrollReveal>
  );
}
