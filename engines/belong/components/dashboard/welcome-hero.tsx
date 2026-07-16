"use client";

import type { HomeEngineData } from "@/engines/belong/data";
import { getBuildGoalOption } from "@/engines/mission/config";
import { Avatar } from "@/components/ui/avatar";
import { FadeIn } from "@/components/motion/fade-in";
import { Badge } from "@/systems/design-system";
import { MapPin, Settings } from "lucide-react";
import Link from "next/link";
import { GlassCard } from "./primitives";

export function ProfileHeader({ profile }: Pick<HomeEngineData, "profile">) {
  const buildGoal = getBuildGoalOption(profile.build_goal);
  const initials =
    profile.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  return (
    <FadeIn>
      <GlassCard glow className="relative overflow-hidden p-8 md:p-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="animate-aurora absolute -right-24 -top-32 h-80 w-80 rounded-full bg-brand/20 blur-[100px]" />
          <div
            className="animate-aurora absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-indigo-500/15 blur-[120px]"
            style={{ animationDelay: "-7s" }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-bg-base/20 to-bg-base/60" />
        </div>

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-5">
            <Avatar
              src={profile.avatar_url ?? undefined}
              alt={profile.full_name ?? "Profile"}
              fallback={initials}
              size="xl"
              className="rounded-2xl ring-2 ring-white/10"
            />
            <div className="min-w-0">
              <p className="text-label">Welcome back</p>
              <h1 className="text-display-lg mt-1 text-gradient">
                {profile.full_name ?? "Builder"}
              </h1>
              {profile.role && (
                <p className="text-body mt-1 text-fg-secondary">{profile.role}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {buildGoal && (
                  <Badge variant="brand" className="capitalize">
                    {buildGoal.label}
                  </Badge>
                )}
                {profile.location && (
                  <span className="inline-flex items-center gap-1 text-caption text-fg-muted">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {profile.location}
                  </span>
                )}
              </div>
              {profile.bio && (
                <p className="text-body mt-4 max-w-xl text-fg-secondary line-clamp-2">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          <Link
            href="/settings"
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-fg-muted transition-colors hover:border-border-strong hover:text-fg-primary"
          >
            <Settings className="h-4 w-4" aria-hidden />
            Edit profile
          </Link>
        </div>
      </GlassCard>
    </FadeIn>
  );
}
