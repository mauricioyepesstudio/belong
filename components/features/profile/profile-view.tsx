"use client";

import { MissionCard } from "@/engines/mission";
import { TIER_ICONS } from "@/engines/billing";
import {
  FeatureScreen,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  ProgressBar,
  StatCard,
  Tabs,
} from "@/systems/design-system";
import type { ImpactScore } from "@/lib/core/impact";
import type { UserStats } from "@/lib/core/stats";
import { formatInitials } from "@/lib/format";
import type { Mission, UserProfile } from "@/types/database.types";
import { MapPin, Pencil, Sparkles, Users, FolderKanban } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { StaggerItem, StaggerList } from "@/components/motion/fade-in";

type ProfileViewProps = {
  profile: UserProfile;
  stats: UserStats;
  missions: Mission[];
  impact: ImpactScore;
};

export function ProfileView({ profile, stats, missions, impact }: ProfileViewProps) {
  const [tab, setTab] = useState("about");
  const primaryMission = missions.find((m) => m.is_primary) ?? missions[0];
  const TierIcon = TIER_ICONS[profile.subscription_tier ?? "free"];
  const impactPercent = Math.min(100, Math.round((impact.score / 500) * 100));

  return (
    <FeatureScreen
      label="Profile"
      title={profile.full_name ?? "Your profile"}
      description="Your public presence and impact on BELONG."
      action={
        <div className="flex gap-2">
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
        <StatCard label="Impact score" value={String(impact.score)} detail={impact.level} icon={Sparkles} />
        <StatCard label="Connections" value={String(stats.connections)} detail={`${stats.pendingConnections} pending`} icon={Users} href="/community" />
        <StatCard label="Projects" value={String(stats.projects)} detail="Active builds" icon={FolderKanban} href="/projects" />
        <StatCard label="Communities" value={String(stats.communities)} detail="Groups joined" icon={Users} href="/community" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center pt-8 pb-8 text-center">
            <Avatar fallback={formatInitials(profile.full_name)} size="xl" className="rounded-2xl" src={profile.avatar_url ?? undefined} />
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
                <MapPin className="h-3.5 w-3.5" aria-hidden />{profile.location}
              </div>
            )}
            <p className="mt-1 text-micro">Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>
            <div className="mt-6 w-full border-t border-border-subtle pt-6 text-left">
              <p className="text-xs font-medium text-fg-muted">Impact level</p>
              <p className="mt-1 text-lg font-semibold text-brand">{impact.level}</p>
              <ProgressBar value={impactPercent} className="mt-3" />
              <p className="mt-2 text-micro text-fg-faint">{impact.score} points · next level at 500</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Tabs
            tabs={[
              { id: "about", label: "About" },
              { id: "missions", label: "Missions", count: missions.length },
              { id: "impact", label: "Impact" },
            ]}
            active={tab}
            onChange={setTab}
          />

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
                    <Link href="/settings" className="text-brand hover:underline">Complete your profile</Link> to share your story.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {tab === "impact" && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium text-fg-muted">Score breakdown</h3>
                <ul className="mt-4 space-y-3">
                  {impact.breakdown.map((item) => (
                    <li key={item.label} className="flex items-center justify-between text-sm">
                      <span className="text-fg-secondary">{item.label}</span>
                      <Badge variant="outline">+{item.points}</Badge>
                    </li>
                  ))}
                </ul>
                {impact.breakdown.length === 0 && (
                  <p className="py-6 text-center text-caption">
                    Start connecting, building, and contributing to grow your impact score.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {tab === "missions" && (
            <StaggerList className="space-y-3">
              {missions.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-caption">No missions defined yet.</CardContent></Card>
              ) : (
                missions.map((m) => (
                  <StaggerItem key={m.id}>
                    <Card>
                      <CardContent className="pt-5">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-fg-primary">{m.title}</p>
                          {m.is_primary && <Badge variant="brand">Primary</Badge>}
                        </div>
                        {m.description && <p className="mt-2 text-caption">{m.description}</p>}
                      </CardContent>
                    </Card>
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
