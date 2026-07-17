"use client";

import {
  joinOrganization,
  leaveOrganization,
} from "@/lib/actions/organizations";
import type { OrganizationDetail } from "@/lib/core/organizations";
import { canAdminOrganization, canManageOrganization } from "@/lib/core/organizations";
import {
  OrganizationAnalyticsTab,
  OrganizationEntityListTab,
  OrganizationImpactTab,
  OrganizationMembersTab,
  OrganizationOverviewTab,
  OrganizationProfileTab,
  OrganizationReputationTab,
  OrganizationSettingsTab,
} from "./organization-tabs";
import {
  Badge,
  Button,
  Card,
  CardContent,
  FeatureScreen,
  Tabs,
  useToast,
} from "@/systems/design-system";
import { ConnectionStatus, LiveBadge } from "@/engines/core/realtime";
import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type CurrentUser = {
  id: string;
  fullName: string | null;
};

export function OrganizationDetailScreen({
  data,
  currentUser,
}: {
  data: OrganizationDetail;
  currentUser: CurrentUser;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState("dashboard");
  const [isPending, startTransition] = useTransition();

  const {
    organization,
    owner,
    membership,
    members,
    communities,
    projects,
    missions,
    impact,
    analytics,
    reputation,
  } = data;

  const isMember = Boolean(membership);
  const isOwner = organization.owner_id === currentUser.id;
  const canManage = canManageOrganization(membership?.role);
  const canAdmin = canAdminOrganization(membership?.role);

  const handleJoin = () => {
    startTransition(async () => {
      const result = await joinOrganization(organization.id);
      if (result.error) toast(result.error, "error");
      else {
        toast("Joined organization", "success");
        router.refresh();
      }
    });
  };

  const handleLeave = () => {
    startTransition(async () => {
      const result = await leaveOrganization(organization.id);
      if (result.error) toast(result.error, "error");
      else {
        toast("Left organization", "success");
        router.push("/organizations");
      }
    });
  };

  const handleSettingsSaved = () => {
    router.refresh();
  };

  return (
    <FeatureScreen
      label="Organization"
      title={organization.name}
      description={organization.description ?? undefined}
      action={
        <Link href="/organizations">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All organizations
          </Button>
        </Link>
      }
    >
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand-secondary/10">
                <Building2 className="h-7 w-7 text-brand" aria-hidden />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {membership && (
                    <Badge variant={isOwner ? "brand" : "outline"} className="capitalize">
                      {membership.role}
                    </Badge>
                  )}
                  <Badge variant="outline">{reputation.reputationLevel}</Badge>
                  <LiveBadge label="Live org" />
                  <ConnectionStatus />
                </div>
                <p className="mt-2 text-caption text-fg-muted">
                  {analytics.memberCount} members · {analytics.projectCount} projects ·{" "}
                  {analytics.communityCount} communities · {reputation.impactScore} impact
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {!isMember && (
                <Button disabled={isPending} onClick={handleJoin}>
                  Join organization
                </Button>
              )}
              {isMember && !isOwner && (
                <Button variant="secondary" disabled={isPending} onClick={handleLeave}>
                  Leave
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 overflow-x-auto">
        <Tabs
          tabs={[
            { id: "dashboard", label: "Dashboard" },
            { id: "profile", label: "Profile" },
            { id: "members", label: "Members", count: members.length },
            { id: "projects", label: "Projects", count: projects.length },
            { id: "communities", label: "Communities", count: communities.length },
            { id: "missions", label: "Missions", count: missions.length },
            { id: "impact", label: "Impact" },
            { id: "reputation", label: "Reputation" },
            { id: "analytics", label: "Analytics" },
            { id: "settings", label: "Settings" },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === "dashboard" && <OrganizationOverviewTab analytics={analytics} />}

      {tab === "profile" && (
        <OrganizationProfileTab
          name={organization.name}
          description={organization.description}
          website={organization.website}
          logoUrl={organization.logo_url}
          slug={organization.slug}
          ownerName={owner.full_name}
          createdAt={organization.created_at}
        />
      )}

      {tab === "members" && (
        <OrganizationMembersTab
          organizationId={organization.id}
          members={members}
          currentUserId={currentUser.id}
          canManage={canManage}
          canAdmin={canAdmin}
          onChanged={handleSettingsSaved}
        />
      )}

      {tab === "projects" && (
        <OrganizationEntityListTab
          items={projects}
          emptyTitle="No projects yet"
          emptyDescription="Projects in this organization appear here."
          hrefPrefix="/projects"
        />
      )}

      {tab === "communities" && (
        <OrganizationEntityListTab
          items={communities}
          emptyTitle="No communities yet"
          emptyDescription="Communities owned by this organization appear here."
          hrefPrefix="/community"
        />
      )}

      {tab === "missions" && (
        <OrganizationEntityListTab
          items={missions}
          labelKey="title"
          emptyTitle="No missions yet"
          emptyDescription="Life missions linked to this organization appear here."
          hrefPrefix="/missions"
        />
      )}

      {tab === "impact" && <OrganizationImpactTab impact={impact} />}
      {tab === "reputation" && <OrganizationReputationTab reputation={reputation} />}
      {tab === "analytics" && <OrganizationAnalyticsTab analytics={analytics} />}

      {tab === "settings" && (
        <OrganizationSettingsTab
          organizationId={organization.id}
          name={organization.name}
          description={organization.description}
          website={organization.website}
          canAdmin={canAdmin}
          onSaved={handleSettingsSaved}
        />
      )}
    </FeatureScreen>
  );
}
