"use client";

import type { HomeImpactMetrics } from "@/engines/belong/home/types";
import { cn } from "@/lib/utils";
import { FolderKanban, HandHeart, Sparkles, Users, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GlassCard } from "../dashboard/primitives";

const METRIC_CONFIG: {
  key: keyof HomeImpactMetrics;
  label: string;
  icon: LucideIcon;
}[] = [
  { key: "peopleHelped", label: "People helped", icon: HandHeart },
  { key: "projectsBuilt", label: "Projects built", icon: FolderKanban },
  { key: "collaborations", label: "Collaborations", icon: UsersRound },
  { key: "communities", label: "Communities", icon: Users },
  { key: "impactScore", label: "Impact score", icon: Sparkles },
];

export function hasMeaningfulImpact(metrics: HomeImpactMetrics): boolean {
  return (
    metrics.impactScore > 0 ||
    metrics.communities > 0 ||
    metrics.projectsBuilt > 0 ||
    metrics.collaborations > 0 ||
    metrics.peopleHelped > 0
  );
}

export function HomeImpactMetrics({ metrics }: { metrics: HomeImpactMetrics }) {
  if (!hasMeaningfulImpact(metrics)) return null;

  return (
    <section aria-labelledby="home-impact-heading">
      <div className="mb-3">
        <p className="text-label">Your impact</p>
        <h2 id="home-impact-heading" className="text-heading mt-1 text-fg-primary">
          Progress so far
        </h2>
      </div>
      <GlassCard className="overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-y divide-white/[0.06] sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
          {METRIC_CONFIG.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className={cn(
                "flex flex-col items-center gap-1.5 px-3 py-4 text-center sm:py-5",
                key === "impactScore" && "bg-brand/5"
              )}
            >
              <Icon
                className={cn("h-4 w-4", key === "impactScore" ? "text-brand" : "text-fg-muted")}
                aria-hidden
              />
              <p
                className={cn(
                  "text-lg font-bold tabular-nums sm:text-xl",
                  key === "impactScore" ? "text-brand" : "text-fg-primary"
                )}
              >
                {metrics[key].toLocaleString()}
              </p>
              <p className="text-micro text-fg-muted">{label}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </section>
  );
}
