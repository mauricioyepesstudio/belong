"use client";

import type { HomeEngineData } from "@/engines/belong/data";
import { LifeMissionPanel } from "@/engines/mission/components/life-mission-panel";
import { Avatar } from "@/components/ui/avatar";
import { FadeIn } from "@/components/motion/fade-in";
import { Badge, ProgressBar } from "@/systems/design-system";
import { formatDistanceToNow } from "@/lib/format";
import { MapPin, Settings, Users, FolderKanban, Sparkles } from "lucide-react";
import Link from "next/link";
import { GlassCard } from "./primitives";

function profileCompleteness(profile: HomeEngineData["profile"]): number {
  const fields = [
    profile.full_name,
    profile.bio,
    profile.build_goal,
    profile.role,
    profile.location,
    profile.avatar_url,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

export function ProfileHeader({
  profile,
  stats,
  missionEngine,
  impactScore,
}: Pick<HomeEngineData, "profile" | "stats" | "missionEngine"> & {
  impactScore: number;
}) {
  const completeness = profileCompleteness(profile);
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

        <div className="relative flex flex-col gap-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
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
                {profile.email && (
                  <p className="mt-1 text-caption text-fg-muted">{profile.email}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="brand">{impactScore} impact</Badge>
                  {profile.location && (
                    <span className="inline-flex items-center gap-1 text-caption text-fg-muted">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      {profile.location}
                    </span>
                  )}
                  <span className="text-caption text-fg-faint">
                    Joined {formatDistanceToNow(profile.created_at)}
                  </span>
                </div>
                {profile.bio && (
                  <p className="text-body mt-4 max-w-xl text-fg-secondary line-clamp-3">
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

          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/community"
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-border-strong hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-2 text-fg-muted">
                <Users className="h-4 w-4" aria-hidden />
                <span className="text-caption">Connections</span>
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-fg-primary">
                {stats.connections}
              </p>
              {stats.pendingConnections > 0 && (
                <p className="mt-1 text-micro text-brand">
                  {stats.pendingConnections} pending
                </p>
              )}
            </Link>
            <Link
              href="/projects"
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-border-strong hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-2 text-fg-muted">
                <FolderKanban className="h-4 w-4" aria-hidden />
                <span className="text-caption">Projects</span>
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-fg-primary">
                {stats.projects}
              </p>
            </Link>
            <Link
              href="/community"
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-border-strong hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-2 text-fg-muted">
                <Sparkles className="h-4 w-4" aria-hidden />
                <span className="text-caption">Communities</span>
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-fg-primary">
                {stats.communities}
              </p>
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="text-label text-fg-muted">Life mission</p>
              <div className="mt-3">
                <LifeMissionPanel
                  profile={profile}
                  lifeMission={missionEngine.lifeMission}
                  progress={missionEngine.lifeMissionProgress}
                  compact
                />
              </div>
            </div>
            <div className="min-w-[200px]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-fg-muted">Profile {completeness}% complete</span>
                {completeness < 100 && (
                  <Link href="/settings" className="text-brand hover:underline">
                    Finish
                  </Link>
                )}
              </div>
              <ProgressBar value={completeness} className="mt-2 h-1.5" />
            </div>
          </div>
        </div>
      </GlassCard>
    </FadeIn>
  );
}
