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
  { key: "peopleHelped", label: "People Helped", icon: HandHeart },
  { key: "projectsBuilt", label: "Projects Built", icon: FolderKanban },
  { key: "collaborations", label: "Collaborations", icon: UsersRound },
  { key: "communities", label: "Communities", icon: Users },
  { key: "impactScore", label: "Impact Score", icon: Sparkles },
];

export function HomeImpactMetrics({ metrics }: { metrics: HomeImpactMetrics }) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="grid grid-cols-2 divide-x divide-y divide-white/[0.06] sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
        {METRIC_CONFIG.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className={cn(
              "flex flex-col items-center gap-2 px-4 py-5 text-center",
              key === "impactScore" && "bg-brand/5"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                key === "impactScore" ? "text-brand" : "text-fg-muted"
              )}
              aria-hidden
            />
            <p
              className={cn(
                "text-xl font-bold tabular-nums",
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
  );
}
