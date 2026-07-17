"use client";

import {
  Badge,
  Card,
  CardContent,
  EmptyState,
  ProgressBar,
  StatCard,
} from "@/systems/design-system";
import type { OrganizationAnalytics, OrganizationImpact } from "@/lib/core/organizations";
import { Activity, FolderKanban, Target, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

export function OrganizationOverviewTab({
  description,
  ownerName,
  impact,
  analytics,
}: {
  description: string | null;
  ownerName: string | null;
  impact: OrganizationImpact;
  analytics: OrganizationAnalytics;
}) {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="text-sm font-medium text-fg-muted">Profile</h3>
          <p className="text-body text-fg-secondary">
            {description ?? "No description yet."}
          </p>
          <p className="text-caption text-fg-muted">
            Owned by {ownerName ?? "Builder"}
          </p>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand" aria-hidden />
            <span className="text-sm">
              Impact score: <strong className="text-brand">{impact.totalImpact}</strong>
            </span>
            <Badge variant="brand">{impact.reputationLevel}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="text-sm font-medium text-fg-muted">Organization health</h3>
          <div className="flex justify-between text-sm">
            <span className="text-fg-muted">Health score</span>
            <span>{analytics.healthScore}%</span>
          </div>
          <ProgressBar value={analytics.healthScore} />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <StatCard label="Members" value={String(analytics.memberCount)} icon={Users} />
            <StatCard label="Projects" value={String(analytics.projectCount)} icon={FolderKanban} />
            <StatCard label="Communities" value={String(analytics.communityCount)} icon={Users} />
            <StatCard label="Missions" value={String(analytics.missionCount)} icon={Target} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function OrganizationMembersTab({
  members,
  currentUserId,
  canManage,
}: {
  members: import("@/lib/core/organizations").OrganizationMember[];
  currentUserId: string;
  canManage: boolean;
}) {
  if (members.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No members yet"
        description="Invite teammates to build together."
        className="mt-6 py-10"
      />
    );
  }

  return (
    <Card className="mt-6">
      <CardContent className="divide-y divide-border-subtle p-0 pt-2">
        <ul>
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
              <div>
                <p className="font-medium text-fg-primary">
                  {member.fullName ?? "Member"}
                  {member.userId === currentUserId && (
                    <span className="text-fg-muted"> (you)</span>
                  )}
                </p>
                <p className="text-caption capitalize text-fg-muted">{member.role}</p>
              </div>
              <Badge variant={member.role === "owner" ? "brand" : "outline"} className="capitalize">
                {member.role}
              </Badge>
            </li>
          ))}
        </ul>
        {!canManage && (
          <p className="px-6 py-4 text-caption text-fg-muted">
            Only owners, admins, and managers can invite members.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function OrganizationEntityListTab({
  items,
  emptyTitle,
  emptyDescription,
  hrefPrefix,
  labelKey = "name",
}: {
  items: { id: string; name?: string; title?: string; slug?: string; status?: string }[];
  emptyTitle: string;
  emptyDescription: string;
  hrefPrefix: string;
  labelKey?: "name" | "title";
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title={emptyTitle}
        description={emptyDescription}
        className="mt-6 py-10"
      />
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {items.map((item) => {
        const label = (labelKey === "title" ? item.title : item.name) ?? "Untitled";
        const href = item.slug ? `${hrefPrefix}/${item.slug}` : `${hrefPrefix}/${item.id}`;
        return (
          <Link key={item.id} href={href}>
            <Card className="transition-colors hover:border-brand/30">
              <CardContent className="flex items-center justify-between py-4">
                <span className="font-medium text-fg-primary">{label}</span>
                {item.status && (
                  <Badge variant="outline" className="capitalize">
                    {item.status}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export function OrganizationImpactTab({ impact }: { impact: OrganizationImpact }) {
  const rows = [
    { label: "Total impact", value: impact.totalImpact },
    { label: "Reputation level", value: impact.reputationLevel },
    { label: "Project impact", value: impact.projectImpact },
    { label: "Community impact", value: impact.communityImpact },
    { label: "Mission impact", value: impact.missionImpact },
  ];

  return (
    <Card className="mt-6">
      <CardContent className="divide-y divide-border-subtle p-0 pt-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-fg-secondary">{row.label}</span>
            <span className="font-medium tabular-nums text-brand">{row.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function OrganizationAnalyticsTab({ analytics }: { analytics: OrganizationAnalytics }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard label="Health score" value={`${analytics.healthScore}%`} icon={Activity} />
      <StatCard
        label="Completed projects"
        value={`${analytics.completedProjects}/${analytics.projectCount}`}
        icon={FolderKanban}
      />
      <StatCard
        label="Participation"
        value={`${analytics.participationRate}%`}
        icon={Users}
      />
      <StatCard label="Active projects" value={String(analytics.activeProjects)} icon={Target} />
      <StatCard label="Communities" value={String(analytics.communityCount)} icon={Users} />
      <StatCard label="Missions" value={String(analytics.missionCount)} icon={Target} />
    </div>
  );
}
