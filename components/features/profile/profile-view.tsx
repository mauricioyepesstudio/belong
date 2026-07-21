"use client";

import { MissionCard } from "@/engines/mission";
import { ReputationDashboard } from "@/engines/identity/components/reputation-dashboard";
import { TIER_ICONS } from "@/engines/billing";
import {
  FeatureScreen,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  ProgressBar,
  StatCard,
  Tabs,
} from "@/systems/design-system";
import type { ReputationProfile } from "@/engines/identity/reputation";
import type { UserStats } from "@/lib/core/stats";
import { formatInitials } from "@/lib/format";
import type { Mission, UserProfile } from "@/types/database.types";
import { MapPin, Pencil, Target, Users, FolderKanban } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { StaggerItem, StaggerList } from "@/components/motion/fade-in";
import { useIdentityRealtime } from "@/engines/core/realtime";

type ProfileViewProps = {
  profile: UserProfile;
  stats: UserStats;
  missions: Mission[];
  reputation: ReputationProfile;
  initialTab?: string;
};

export function ProfileView({
  profile,
  stats,
  missions,
  reputation: initialReputation,
  initialTab = "reputation",
}: ProfileViewProps) {
  const [tab, setTab] = useState(initialTab);
  const [reputation, setReputation] = useState(initialReputation);
  const primaryMission = missions.find((m) => m.is_primary) ?? missions[0];
  const TierIcon = TIER_ICONS[profile.subscription_tier ?? "free"];

  useIdentityRealtime({
    userId: profile.id,
    onImpactInsert: (event) => {
      setReputation((prev) => ({
        ...prev,
        totalImpact: prev.totalImpact + event.points,
        recentEvents: [event, ...prev.recentEvents].slice(0, 12),
        eventTotals: prev.eventTotals.some((t) => t.module === event.module)
          ? prev.eventTotals.map((t) =>
              t.module === event.module
                ? { ...t, points: t.points + event.points, count: t.count + 1 }
                : t
            )
          : [...prev.eventTotals, { module: event.module, points: event.points, count: 1 }],
        scores: {
          ...prev.scores,
          reputationScore: prev.scores.reputationScore + event.points,
        },
      }));
    },
  });

  return (
    <FeatureScreen
      label="Profile"
      title={profile.full_name ?? "Your profile"}
      description="Your impact, connections, and missions across BELONG."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/creator">
            <Button variant="ghost">Creator hub</Button>
          </Link>
          <Link href="/settings">
            <Button variant="secondary">
              <Pencil className="h-4 w-4" aria-hidden />
              Edit profile
            </Button>
          </Link>
        </div>
      }
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total impact"
          value={String(reputation.totalImpact)}
          detail={reputation.reputationLevel}
          icon={Users}
        />
        <StatCard
          label="Connections"
          value={String(stats.connections)}
          detail={`${stats.pendingConnections} pending`}
          icon={Users}
          href="/community"
        />
        <StatCard
          label="Projects"
          value={String(stats.projects)}
          detail="Active builds"
          icon={FolderKanban}
          href="/projects"
        />
        <StatCard
          label="Streak"
          value={`${reputation.currentStreak}d`}
          detail={`Best ${reputation.longestStreak}d`}
          icon={Users}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center pt-8 pb-8 text-center">
            <Avatar
              fallback={formatInitials(profile.full_name)}
              size="xl"
              className="rounded-2xl"
              src={profile.avatar_url ?? undefined}
            />
            {profile.role && <p className="mt-1 text-sm text-brand">{profile.role}</p>}
            {(profile.subscription_tier ?? "free") !== "free" && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand/10 px-3 py-1">
                <TierIcon className="h-3.5 w-3.5 text-brand" aria-hidden />
                <span className="text-xs font-medium capitalize text-brand">
                  {profile.subscription_tier}
                </span>
              </div>
            )}
            {profile.location && (
              <div className="mt-3 flex items-center gap-1.5 text-caption">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {profile.location}
              </div>
            )}
            <p className="mt-1 text-micro">
              Joined{" "}
              {new Date(profile.created_at).toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </p>
            <div className="mt-6 w-full border-t border-border-subtle pt-6 text-left">
              <p className="text-xs font-medium text-fg-muted">Progress to {reputation.nextLevelAt}</p>
              <ProgressBar value={reputation.progressToNext} className="mt-3" />
              <p className="mt-2 text-micro text-fg-faint">
                Founder #{reputation.ranks.founderRank} · Community #{reputation.ranks.communityRank}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Tabs
            tabs={[
              { id: "reputation", label: "Reputation" },
              { id: "about", label: "About" },
              { id: "missions", label: "Missions", count: missions.length },
            ]}
            active={tab}
            onChange={setTab}
          />

          {tab === "reputation" && <ReputationDashboard reputation={reputation} />}

          {tab === "about" && (
            <Card>
              <CardContent className="space-y-6 pt-6">
                <MissionCard profile={profile} mission={primaryMission ?? null} compact />
                {profile.bio && (
                  <div>
                    <h3 className="text-sm font-medium text-fg-muted">About</h3>
                    <p className="mt-2 text-body">{profile.bio}</p>
                  </div>
                )}
                {!profile.bio && !profile.build_vision && !primaryMission?.description && (
                  <p className="text-caption">
                    <Link href="/settings" className="text-brand hover:underline">
                      Complete your profile
                    </Link>{" "}
                    to share your story.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {tab === "missions" && (
            <StaggerList className="space-y-3">
              {missions.length === 0 ? (
                <EmptyState
                  icon={Target}
                  title="No missions yet"
                  description="Define a mission during onboarding or from your dashboard to track what you're building."
                  action={{ label: "Go to Home", href: "/dashboard" }}
                />
              ) : (
                missions.map((m) => (
                  <StaggerItem key={m.id}>
                    <Link href={`/missions/${m.id}`}>
                      <Card className="transition-colors hover:border-brand/30">
                        <CardContent className="pt-5">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-fg-primary">{m.title}</p>
                            {m.is_primary && <Badge variant="brand">Primary</Badge>}
                          </div>
                          {m.description && <p className="mt-2 text-caption">{m.description}</p>}
                          <p className="mt-3 text-sm text-brand">View mission →</p>
                        </CardContent>
                      </Card>
                    </Link>
                  </StaggerItem>
                ))
              )}
            </StaggerList>
          )}
        </div>
      </div>
    </FeatureScreen>
  );
}
