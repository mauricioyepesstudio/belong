"use client";

import { MissionCard } from "@/engines/mission";
import { ImpactSection, applyImpactScoreInsert, getImpactActionLabel } from "@/engines/impact";
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
import type { ImpactScoreProfile } from "@/engines/impact";
import type { UserCommunity } from "@/lib/core";
import type { ProfileProject, ProfileCompatibility } from "@/lib/data/profile";
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
  communities: UserCommunity[];
  projects: ProfileProject[];
  reputation: ReputationProfile;
  impactScore: ImpactScoreProfile;
  compatibility: ProfileCompatibility;
  initialTab?: string;
};

export function ProfileView({
  profile,
  stats,
  missions,
  communities,
  projects,
  reputation: initialReputation,
  impactScore: initialImpactScore,
  compatibility,
  initialTab = "reputation",
}: ProfileViewProps) {
  const [tab, setTab] = useState(initialTab);
  const [reputation, setReputation] = useState(initialReputation);
  const [impactScore, setImpactScore] = useState(initialImpactScore);
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
      setImpactScore((prev) => applyImpactScoreInsert(prev, event));
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
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
          href="/community?tab=people"
        />
        <StatCard
          label="Communities"
          value={String(stats.communities)}
          detail="Joined"
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
          icon={Target}
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
              { id: "impact", label: "Impact" },
              { id: "activity", label: "Activity" },
              { id: "about", label: "About" },
              { id: "projects", label: "Projects", count: projects.length },
              { id: "communities", label: "Communities", count: communities.length },
              { id: "compatibility", label: "Compatibility" },
              { id: "missions", label: "Missions", count: missions.length },
            ]}
            active={tab}
            onChange={setTab}
          />

          {tab === "reputation" && <ReputationDashboard reputation={reputation} />}

          {tab === "impact" && <ImpactSection impact={impactScore} />}

          {tab === "activity" && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium text-fg-muted">Recent activity</h3>
                {reputation.recentEvents.length === 0 ? (
                  <div className="mt-4">
                    <p className="text-caption text-fg-muted">
                      Your impact events will appear here as you contribute.
                    </p>
                    <Link
                      href="/community"
                      className="mt-3 inline-flex text-sm font-medium text-brand hover:underline"
                    >
                      Browse communities
                    </Link>
                  </div>
                ) : (
                  <ul className="mt-4 divide-y divide-border-subtle">
                    {reputation.recentEvents.map((event) => (
                      <li key={event.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium text-fg-primary">
                            {getImpactActionLabel(event.eventType)}
                          </p>
                          <p className="text-xs text-fg-muted capitalize">{event.module}</p>
                        </div>
                        <Badge variant="brand">+{event.points}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

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

          {tab === "projects" && (
            <StaggerList className="space-y-3">
              {projects.length === 0 ? (
                <EmptyState
                  icon={FolderKanban}
                  title="No projects yet"
                  description="Create a project from Home or the Projects page."
                  action={{ label: "Browse projects", href: "/projects" }}
                />
              ) : (
                projects.map((p) => (
                  <StaggerItem key={p.id}>
                    <Link href={`/projects/${p.id}`}>
                      <Card className="transition-colors hover:border-brand/30">
                        <CardContent className="flex items-center justify-between pt-5">
                          <div>
                            <p className="font-medium text-fg-primary">{p.name}</p>
                            <p className="mt-1 text-caption capitalize text-fg-muted">{p.status}</p>
                          </div>
                          <Badge variant="outline">{p.progress}%</Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  </StaggerItem>
                ))
              )}
            </StaggerList>
          )}

          {tab === "communities" && (
            <StaggerList className="space-y-3">
              {communities.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No communities yet"
                  description="Discover and join communities to connect with other builders."
                  action={{ label: "Explore communities", href: "/community" }}
                />
              ) : (
                communities.map((c) => (
                  <StaggerItem key={c.id}>
                    <Link href={`/community/${c.slug}`}>
                      <Card className="transition-colors hover:border-brand/30">
                        <CardContent className="flex items-center justify-between pt-5">
                          <div>
                            <p className="font-medium text-fg-primary">{c.name}</p>
                            {c.tag && <p className="mt-1 text-caption text-fg-muted">{c.tag}</p>}
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {c.role}
                          </Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  </StaggerItem>
                ))
              )}
            </StaggerList>
          )}

          {tab === "compatibility" && (
            <Card>
              <CardContent className="space-y-6 pt-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-fg-muted">Compatibility profile</h3>
                    <p className="mt-1 text-caption text-fg-muted">
                      This metadata powers deterministic opportunity matching across BELONG.
                    </p>
                  </div>
                  <Badge variant="brand">{compatibility.completeness.score}% complete</Badge>
                </div>

                <ProgressBar value={compatibility.completeness.score} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <CompatibilityGroup label="Skills" items={compatibility.skills} />
                  <CompatibilityGroup label="Interests" items={compatibility.interests} />
                  <CompatibilityGroup label="Strengths" items={compatibility.strengths} />
                  <CompatibilityGroup label="Values" items={compatibility.values} />
                </div>

                {compatibility.completeness.missingFields.length > 0 && (
                  <p className="text-caption text-fg-muted">
                    Still to add:{" "}
                    {compatibility.completeness.missingFields
                      .map((field) => COMPATIBILITY_FIELD_LABELS[field] ?? field)
                      .join(", ")}
                  </p>
                )}

                <Link href="/settings?tab=profile">
                  <Button variant="secondary">Edit compatibility metadata</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {tab === "missions" && (
            <StaggerList className="space-y-3">
              {missions.length === 0 ? (
                <EmptyState
                  icon={Target}
                  title="No missions yet"
                  description="Define a mission during onboarding or update your build goal in Settings."
                  action={{ label: "Edit build goal", href: "/settings?tab=profile" }}
                />
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
                        <Link
                          href="/settings?tab=profile"
                          className="mt-3 inline-flex text-sm text-brand hover:underline"
                        >
                          Edit in settings →
                        </Link>
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

const COMPATIBILITY_FIELD_LABELS: Record<string, string> = {
  name: "Name",
  bio: "Bio",
  location: "Location",
  role: "Role",
  skills: "Skills",
  strengths: "Strengths",
  interests: "Interests",
  values: "Values",
  personality: "Personality traits",
  experience: "Experience",
};

function CompatibilityGroup({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-xs font-medium uppercase tracking-wide text-fg-muted">{label}</h4>
      {items.length === 0 ? (
        <p className="mt-2 text-caption text-fg-faint">Not set</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge key={item} variant="outline">
              {item}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
