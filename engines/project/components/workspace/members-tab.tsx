"use client";

import type { ProjectMember } from "@/lib/core";
import { updateProjectMemberRole } from "@/lib/actions/project-workspace";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  useToast,
} from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import { Users } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

const ROLE_OPTIONS = ["admin", "collaborator", "member"] as const;

export function ProjectMembersTab({
  projectId,
  members,
  currentUserId,
  isOwner,
  isAdmin,
}: {
  projectId: string;
  members: ProjectMember[];
  currentUserId: string;
  isOwner: boolean;
  isAdmin: boolean;
  communityMemberIds?: string[];
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const canManage = isOwner || isAdmin;

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
            <p className="text-sm font-medium text-fg-primary">Invite collaborators</p>
            <p className="text-sm text-fg-secondary">
              Connect with builders on the Community page, then ask them to join this
              project&apos;s community. Direct invites from project settings are coming soon.
            </p>
            <Link href="/community">
              <Button variant="secondary" size="sm">
                Find people in Community
              </Button>
            </Link>
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
