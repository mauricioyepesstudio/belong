"use client";

import { completeDailyMission } from "@/lib/actions/mission-engine";
import type { HomeEngineData } from "@/engines/belong/data";
import { ScrollReveal } from "@/components/motion/fade-in";
import { Badge, Button, EmptyState, useToast } from "@/systems/design-system";
import { ArrowRight, Check, CheckCircle2, Flame, Target, Zap } from "lucide-react";
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

  const pending = missionEngine.dailyMissions.filter((m) => m.status === "pending");
  const completed = missionEngine.dailyMissions.filter((m) => m.status === "completed");

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
            <div className="flex items-center gap-3">
              {missionEngine.momentum.current_streak > 0 && (
                <span className="inline-flex items-center gap-1.5 text-sm text-fg-muted">
                  <Flame className="h-4 w-4 text-orange-400" aria-hidden />
                  {missionEngine.momentum.current_streak} day streak
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onNewMission}
                className="text-fg-muted hover:text-brand"
              >
                <Zap className="h-4 w-4" aria-hidden />
                New mission
              </Button>
            </div>
          }
        />

        {pending.length === 0 && completed.length === 0 ? (
          <GlassCard>
            <EmptyState
              icon={Target}
              title="No missions for today"
              description="Create a custom mission or explore communities — daily missions are generated when you visit your dashboard."
              action={{ label: "New mission", onClick: onNewMission }}
              className="border-0 bg-transparent py-12"
            />
          </GlassCard>
        ) : pending.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
              <CheckCircle2 className="h-7 w-7 text-success" aria-hidden />
            </div>
            <h3 className="text-heading mt-6 text-fg-primary">All missions complete</h3>
            <p className="text-body mt-2 text-fg-muted">
              You finished {completed.length} mission{completed.length === 1 ? "" : "s"} today.
              {missionEngine.momentum.current_streak > 0 &&
                ` Keep your ${missionEngine.momentum.current_streak}-day streak going tomorrow.`}
            </p>
            <Button variant="outline" className="mt-6 rounded-2xl" onClick={onNewMission}>
              Add another mission
            </Button>
          </GlassCard>
        ) : (
          <ul className="space-y-3">
            {pending.map((mission) => (
              <li key={mission.id}>
                <GlassCard hover className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Link href={`/missions/${mission.id}`} className="min-w-0 flex-1 group">
                      <p className="text-base font-semibold text-fg-primary group-hover:text-brand">
                        {mission.title}
                      </p>
                      {mission.description && (
                        <p className="mt-1 text-sm text-fg-muted">{mission.description}</p>
                      )}
                      <Badge variant="outline" className="mt-3">
                        +{mission.impact_points} impact
                      </Badge>
                    </Link>
                    <div className="flex shrink-0 gap-2">
                      <Link href={`/missions/${mission.id}`}>
                        <Button variant="outline" size="sm" className="rounded-xl">
                          View
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

        {completed.length > 0 && pending.length > 0 && (
          <div className="mt-6">
            <p className="mb-3 text-micro font-medium uppercase tracking-widest text-fg-faint">
              Completed today ({completed.length})
            </p>
            <ul className="space-y-2">
              {completed.map((mission) => (
                <li key={mission.id}>
                  <Link
                    href={`/missions/${mission.id}`}
                    className="flex items-center justify-between rounded-xl border border-success/15 bg-success/5 px-4 py-3 opacity-80 transition-opacity hover:opacity-100"
                  >
                    <span className="text-sm text-fg-secondary line-through">{mission.title}</span>
                    <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {missionEngine.dailyTotal > 0 && (
          <p className="mt-4 text-center text-micro text-fg-faint">
            {missionEngine.dailyCompleted}/{missionEngine.dailyTotal} completed today
          </p>
        )}
      </section>
    </ScrollReveal>
  );
}
