"use client";

import {
  createOrganization,
  joinOrganization,
  leaveOrganization,
  inviteToOrganization,
  updateOrganizationSettings,
} from "@/lib/actions/organizations";
import type { OrganizationDetail } from "@/lib/core/organizations";
import { canAdminOrganization, canManageOrganization } from "@/lib/core/organizations";
import {
  OrganizationAnalyticsTab,
  OrganizationEntityListTab,
  OrganizationImpactTab,
  OrganizationMembersTab,
  OrganizationOverviewTab,
} from "./organization-tabs";
import {
  Badge,
  Button,
  Card,
  CardContent,
  FeatureScreen,
  Input,
  Label,
  Modal,
  Tabs,
  Textarea,
  useToast,
} from "@/systems/design-system";
import { ConnectionStatus, LiveBadge } from "@/engines/core/realtime";
import { ArrowLeft, Building2, Settings, UserPlus } from "lucide-react";
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inviteUserId, setInviteUserId] = useState("");
  const [isPending, startTransition] = useTransition();

  const { organization, owner, membership, members, communities, projects, missions, impact, analytics } =
    data;

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

  const handleInvite = () => {
    const userId = inviteUserId.trim();
    if (!userId) return;
    startTransition(async () => {
      const result = await inviteToOrganization(organization.id, userId);
      if (result.error) toast(result.error, "error");
      else {
        toast("Member invited", "success");
        setInviteUserId("");
        router.refresh();
      }
    });
  };

  const handleSettings = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateOrganizationSettings(organization.id, {
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || null,
        website: (formData.get("website") as string) || null,
      });
      if (result.error) toast(result.error, "error");
      else {
        toast("Settings saved", "success");
        setSettingsOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <>
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
                    <Badge variant="outline">{impact.reputationLevel}</Badge>
                    <LiveBadge label="Live org" />
                    <ConnectionStatus />
                  </div>
                  <p className="mt-2 text-caption text-fg-muted">
                    {analytics.memberCount} members · {analytics.projectCount} projects ·{" "}
                    {analytics.communityCount} communities
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
                {canAdmin && (
                  <Button variant="secondary" onClick={() => setSettingsOpen(true)}>
                    <Settings className="h-4 w-4" aria-hidden />
                    Settings
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
              { id: "members", label: "Members", count: members.length },
              { id: "projects", label: "Projects", count: projects.length },
              { id: "communities", label: "Communities", count: communities.length },
              { id: "missions", label: "Missions", count: missions.length },
              { id: "impact", label: "Impact" },
              { id: "analytics", label: "Analytics" },
            ]}
            active={tab}
            onChange={setTab}
          />
        </div>

        {tab === "dashboard" && (
          <OrganizationOverviewTab
            description={organization.description}
            ownerName={owner.full_name}
            impact={impact}
            analytics={analytics}
          />
        )}

        {tab === "members" && (
          <>
            {canManage && (
              <Card className="mt-6">
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
                  <Button disabled={isPending || !inviteUserId.trim()} onClick={handleInvite}>
                    <UserPlus className="h-4 w-4" aria-hidden />
                    Invite
                  </Button>
                </CardContent>
              </Card>
            )}
            <OrganizationMembersTab
              members={members}
              currentUserId={currentUser.id}
              canManage={canManage}
            />
          </>
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
        {tab === "analytics" && <OrganizationAnalyticsTab analytics={analytics} />}
      </FeatureScreen>

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Organization settings"
        description="Update profile and public details."
      >
        <form action={handleSettings} className="space-y-4">
          <div>
            <Label htmlFor="org-name">Name</Label>
            <Input id="org-name" name="name" defaultValue={organization.name} required />
          </div>
          <div>
            <Label htmlFor="org-desc">Description</Label>
            <Textarea
              id="org-desc"
              name="description"
              defaultValue={organization.description ?? ""}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="org-website">Website</Label>
            <Input
              id="org-website"
              name="website"
              defaultValue={organization.website ?? ""}
              placeholder="https://"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" isLoading={isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
