"use client";

import type { ProjectMember } from "@/lib/core";
import { updateProjectMemberRole } from "@/lib/actions/project-workspace";
import { inviteToProject } from "@/lib/actions/projects";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
  Label,
  useToast,
} from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import { Users } from "lucide-react";
import { useState, useTransition } from "react";

const ROLE_OPTIONS = ["admin", "collaborator", "member"] as const;

export function ProjectMembersTab({
  projectId,
  members,
  currentUserId,
  isOwner,
  isAdmin,
  communityMemberIds,
}: {
  projectId: string;
  members: ProjectMember[];
  currentUserId: string;
  isOwner: boolean;
  isAdmin: boolean;
  communityMemberIds?: string[];
}) {
  const { toast } = useToast();
  const [inviteUserId, setInviteUserId] = useState("");
  const [isPending, startTransition] = useTransition();

  const canManage = isOwner || isAdmin;

  const handleInvite = () => {
    const userId = inviteUserId.trim();
    if (!userId) return;
    startTransition(async () => {
      const result = await inviteToProject(projectId, userId);
      if (result.error) toast(result.error, "error");
      else {
        toast("Member invited", "success");
        setInviteUserId("");
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
            <Label htmlFor="invite-user">Invite by user ID</Label>
            <div className="flex gap-2">
              <Input
                id="invite-user"
                value={inviteUserId}
                onChange={(e) => setInviteUserId(e.target.value)}
                placeholder="User UUID from community"
                disabled={isPending}
              />
              <Button disabled={isPending || !inviteUserId.trim()} onClick={handleInvite}>
                Invite
              </Button>
            </div>
            <p className="text-micro text-fg-faint">
              User must be a member of the project&apos;s community.
            </p>
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
