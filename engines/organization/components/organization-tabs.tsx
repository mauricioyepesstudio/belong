"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  Label,
  ProgressBar,
  StatCard,
  Textarea,
  useToast,
} from "@/systems/design-system";
import type {
  OrganizationAnalytics,
  OrganizationImpact,
  OrganizationMember,
  OrganizationReputation,
} from "@/lib/core/organizations";
import { updateOrganizationMemberRole, updateOrganizationSettings, inviteToOrganization } from "@/lib/actions/organizations";
import { Activity, FolderKanban, Globe, Settings, Target, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { OrganizationMemberRole } from "@/types/database.types";

const INVITE_ROLE_OPTIONS: OrganizationMemberRole[] = ["admin", "manager", "member", "guest"];
const MANAGE_ROLE_OPTIONS: OrganizationMemberRole[] = ["admin", "manager", "member", "guest"];

export function OrganizationOverviewTab({
  analytics,
}: {
  analytics: OrganizationAnalytics;
}) {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
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

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="text-sm font-medium text-fg-muted">Activity snapshot</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Active projects"
              value={String(analytics.activeProjects)}
              icon={FolderKanban}
            />
            <StatCard
              label="Completed"
              value={String(analytics.completedProjects)}
              icon={Target}
            />
            <StatCard
              label="Participation"
              value={`${analytics.participationRate}%`}
              icon={Activity}
            />
            <StatCard label="Members" value={String(analytics.memberCount)} icon={Users} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function OrganizationProfileTab({
  name,
  description,
  website,
  logoUrl,
  slug,
  ownerName,
  createdAt,
}: {
  name: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  slug: string;
  ownerName: string | null;
  createdAt: string;
}) {
  return (
    <Card className="mt-6">
      <CardContent className="space-y-6 pt-6">
        <div className="flex items-start gap-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand-secondary/10">
              <Users className="h-8 w-8 text-brand" aria-hidden />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-fg-primary">{name}</h3>
            <p className="text-caption text-fg-muted">/{slug}</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-fg-muted">About</h4>
          <p className="mt-2 text-body text-fg-secondary">
            {description ?? "No description yet."}
          </p>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-fg-muted">Owner</dt>
            <dd className="mt-1 font-medium text-fg-primary">{ownerName ?? "Builder"}</dd>
          </div>
          <div>
            <dt className="text-sm text-fg-muted">Created</dt>
            <dd className="mt-1 font-medium text-fg-primary">
              {new Date(createdAt).toLocaleDateString()}
            </dd>
          </div>
          {website && (
            <div className="sm:col-span-2">
              <dt className="text-sm text-fg-muted">Website</dt>
              <dd className="mt-1">
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-brand hover:underline"
                >
                  <Globe className="h-4 w-4" aria-hidden />
                  {website}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}

export function OrganizationSettingsTab({
  organizationId,
  name,
  description,
  website,
  canAdmin,
  onSaved,
}: {
  organizationId: string;
  name: string;
  description: string | null;
  website: string | null;
  canAdmin: boolean;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  if (!canAdmin) {
    return (
      <EmptyState
        icon={Settings}
        title="Admin access required"
        description="Only owners and admins can change organization settings."
        className="mt-6 py-10"
      />
    );
  }

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateOrganizationSettings(organizationId, {
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || null,
        website: (formData.get("website") as string) || null,
      });
      if (result.error) toast(result.error, "error");
      else {
        toast("Settings saved", "success");
        onSaved();
      }
    });
  };

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="settings-name">Name</Label>
            <Input id="settings-name" name="name" defaultValue={name} required />
          </div>
          <div>
            <Label htmlFor="settings-desc">Description</Label>
            <Textarea
              id="settings-desc"
              name="description"
              defaultValue={description ?? ""}
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="settings-website">Website</Label>
            <Input
              id="settings-website"
              name="website"
              defaultValue={website ?? ""}
              placeholder="https://"
            />
          </div>
          <Button type="submit" variant="brand" isLoading={isPending}>
            Save settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function OrganizationReputationTab({ reputation }: { reputation: OrganizationReputation }) {
  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-fg-muted">Reputation level</p>
              <p className="text-2xl font-semibold capitalize text-fg-primary">
                {reputation.reputationLevel}
              </p>
            </div>
            <Badge variant="brand">{reputation.impactScore} impact</Badge>
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-fg-muted">Progress to next level</span>
              <span>{reputation.progressToNext}%</span>
            </div>
            <ProgressBar value={reputation.progressToNext} />
            <p className="mt-2 text-caption text-fg-muted">
              Next threshold: {reputation.nextThreshold} impact points
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Organization events" value={String(reputation.totalEvents)} icon={Activity} />
        <StatCard
          label="Member contributions"
          value={String(reputation.memberContributions)}
          icon={TrendingUp}
        />
      </div>
    </div>
  );
}

export function OrganizationMembersTab({
  organizationId,
  members,
  currentUserId,
  canManage,
  canAdmin,
  onChanged,
}: {
  organizationId: string;
  members: OrganizationMember[];
  currentUserId: string;
  canManage: boolean;
  canAdmin: boolean;
  onChanged: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [inviteUserId, setInviteUserId] = useState("");
  const [inviteRole, setInviteRole] = useState<OrganizationMemberRole>("member");
  const [isPending, startTransition] = useTransition();

  const handleInvite = () => {
    const userId = inviteUserId.trim();
    if (!userId) return;
    startTransition(async () => {
      const result = await inviteToOrganization(organizationId, userId, inviteRole);
      if (result.error) toast(result.error, "error");
      else {
        toast("Member invited", "success");
        setInviteUserId("");
        onChanged();
        router.refresh();
      }
    });
  };

  const handleRoleChange = (userId: string, role: OrganizationMemberRole) => {
    startTransition(async () => {
      const result = await updateOrganizationMemberRole(organizationId, userId, role);
      if (result.error) toast(result.error, "error");
      else {
        toast("Role updated", "success");
        onChanged();
        router.refresh();
      }
    });
  };

  return (
    <div className="mt-6 space-y-4">
      {canManage && (
        <Card>
          <CardContent className="flex flex-wrap items-end gap-3 pt-6">
            <div className="min-w-[220px] flex-1">
              <Label htmlFor="invite-user">Invite by user ID</Label>
              <Input
                id="invite-user"
                value={inviteUserId}
                onChange={(e) => setInviteUserId(e.target.value)}
                placeholder="User UUID"
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                className="mt-1 block rounded-lg border border-border-subtle bg-bg-base px-3 py-2 text-sm"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as OrganizationMemberRole)}
                disabled={isPending}
              >
                {INVITE_ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role} className="capitalize">
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <Button disabled={isPending || !inviteUserId.trim()} onClick={handleInvite}>
              Invite
            </Button>
          </CardContent>
        </Card>
      )}

      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members yet"
          description="Invite teammates to build together."
          className="py-10"
        />
      ) : (
        <Card>
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
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={member.role === "owner" ? "brand" : "outline"}
                      className="capitalize"
                    >
                      {member.role}
                    </Badge>
                    {canAdmin &&
                      member.role !== "owner" &&
                      member.userId !== currentUserId && (
                        <select
                          className="rounded-lg border border-border-subtle bg-bg-base px-2 py-1 text-sm capitalize"
                          value={
                            MANAGE_ROLE_OPTIONS.includes(member.role as OrganizationMemberRole)
                              ? member.role
                              : "member"
                          }
                          onChange={(e) =>
                            handleRoleChange(member.userId, e.target.value as OrganizationMemberRole)
                          }
                          disabled={isPending}
                        >
                          {MANAGE_ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
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
