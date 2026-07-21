"use client";

import type { CommunityMember, ProjectMember } from "@/lib/core";
import { updateProjectMemberRole } from "@/lib/actions/project-workspace";
import { inviteToProject } from "@/lib/actions/projects";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Label,
  useToast,
} from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

const ROLE_OPTIONS = ["admin", "collaborator", "member"] as const;

export function ProjectMembersTab({
  projectId,
  members,
  communityMembers,
  currentUserId,
  isOwner,
  isAdmin,
}: {
  projectId: string;
  members: ProjectMember[];
  communityMembers: CommunityMember[];
  currentUserId: string;
  isOwner: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [inviteUserId, setInviteUserId] = useState("");
  const [isPending, startTransition] = useTransition();

  const canManage = isOwner || isAdmin;
  const memberIds = useMemo(() => new Set(members.map((m) => m.userId)), [members]);
  const inviteCandidates = useMemo(
    () =>
      communityMembers.filter(
        (m) => m.userId !== currentUserId && !memberIds.has(m.userId)
      ),
    [communityMembers, currentUserId, memberIds]
  );

  const handleInvite = () => {
    if (!inviteUserId) return;
    startTransition(async () => {
      const result = await inviteToProject(projectId, inviteUserId);
      if (result.error) toast(result.error, "error");
      else {
        toast("Member invited", "success");
        setInviteUserId("");
        router.refresh();
      }
    });
  };

  const handleRoleChange = (userId: string, role: (typeof ROLE_OPTIONS)[number]) => {
    startTransition(async () => {
      const result = await updateProjectMemberRole(projectId, userId, role);
      if (result.error) toast(result.error, "error");
      else toast("Role updated", "success");
    });
  };

  return (
    <div className="mt-6 space-y-4">
      {canManage && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <p className="text-sm font-medium text-fg-primary">Invite from community</p>
            {inviteCandidates.length === 0 ? (
              <p className="text-sm text-fg-secondary">
                No community members available to invite. Ask builders to join the
                project&apos;s community first.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="invite-member">Community member</Label>
                  <select
                    id="invite-member"
                    value={inviteUserId}
                    onChange={(e) => setInviteUserId(e.target.value)}
                    disabled={isPending}
                    className="w-full rounded-xl border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-fg-primary"
                  >
                    <option value="">Select a member…</option>
                    {inviteCandidates.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.fullName ?? "Builder"}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  disabled={isPending || !inviteUserId}
                  isLoading={isPending}
                  onClick={handleInvite}
                >
                  Add to project
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {members.length === 0 ? (
        <EmptyState icon={Users} title="No members yet" description="Invite collaborators to get started." />
      ) : (
        <Card>
          <CardContent className="divide-y divide-border-subtle p-0 pt-2">
            <ul>
              {members.map((member) => (
                <li key={member.key} className="flex items-center gap-3 px-4 py-4 sm:px-6">
                  <Avatar
                    src={member.avatarUrl ?? undefined}
                    fallback={formatInitials(member.fullName)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-fg-primary">
                        {member.fullName ?? "Builder"}
                        {member.userId === currentUserId && (
                          <span className="text-fg-muted"> (you)</span>
                        )}
                      </p>
                      <Badge
                        variant={member.role === "owner" ? "brand" : "outline"}
                        className="capitalize"
                      >
                        {member.role}
                      </Badge>
                    </div>
                    {member.bio && (
                      <p className="mt-0.5 truncate text-caption text-fg-muted">{member.bio}</p>
                    )}
                  </div>
                  {canManage &&
                    member.role !== "owner" &&
                    member.userId !== currentUserId && (
                      <select
                        className="rounded-lg border border-border-subtle bg-bg-base px-2 py-1 text-sm"
                        value={member.role === "admin" || member.role === "collaborator" ? member.role : "member"}
                        onChange={(e) =>
                          handleRoleChange(
                            member.userId,
                            e.target.value as (typeof ROLE_OPTIONS)[number]
                          )
                        }
                        disabled={isPending}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
