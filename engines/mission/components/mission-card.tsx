"use client";

import { EmptyState } from "@/systems/design-system";
import { getBuildGoalOption, getMissionText } from "@/engines/mission/config";
import { cn } from "@/lib/utils";
import type { Mission, UserProfile } from "@/types/database.types";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type MissionCardProps = {
  profile: UserProfile;
  mission: Mission | null;
  compact?: boolean;
};

export function MissionCard({ profile, mission, compact }: MissionCardProps) {
  const text = getMissionText(profile, mission);
  const buildGoal = getBuildGoalOption(profile.build_goal);
  const BuildIcon = buildGoal?.icon ?? Sparkles;

  if (!text) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Define your mission"
        description="Share what you're building so the right people can find you."
        action={{ label: "Edit profile", href: "/profile" }}
        className="border-none py-4"
      />
    );
  }

  return (
    <div className="space-y-4">
      {mission?.title && (
        <p className="text-sm font-medium text-brand">{mission.title}</p>
      )}
      <p className={cn("leading-relaxed text-fg-secondary", compact ? "text-sm line-clamp-4" : "text-sm")}>
        {text}
      </p>
      {buildGoal && (
        <div
          className={cn(
            "rounded-2xl border border-border-subtle bg-gradient-to-br p-4",
            buildGoal.gradient
          )}
        >
          <div className="flex items-center gap-3">
            <BuildIcon className="h-5 w-5 text-brand" aria-hidden />
            <div>
              <p className="text-xs text-fg-muted">Building toward</p>
              <p className="text-sm font-semibold text-fg-primary">{buildGoal.label}</p>
            </div>
          </div>
        </div>
      )}
      {!compact && (
        <Link
          href="/profile"
          className="inline-flex items-center gap-1 text-sm text-brand hover:underline"
        >
          Edit profile
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function BuildGoalBadge({ profile }: { profile: UserProfile }) {
  const buildGoal = getBuildGoalOption(profile.build_goal);
  if (!buildGoal) return null;
  const Icon = buildGoal.icon;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-3 py-1.5">
      <Icon className="h-3.5 w-3.5 text-brand" aria-hidden />
      <span className="text-xs font-medium text-brand">{buildGoal.label}</span>
    </div>
  );
}
