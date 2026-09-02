"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Search, UserPlus, X } from "lucide-react";
import { inviteToCircle, leaveCircle, removeCircleMember } from "@/lib/actions/circles";
import { Avatar, Button, Input, Modal, useToast } from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import type { ConnectedUser } from "@/lib/data/connections";

type CircleLeaveButtonProps = {
  circleId: string;
  circleName: string;
};

export function CircleLeaveButton({ circleId, circleName }: CircleLeaveButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const handleLeave = () => {
    startTransition(async () => {
      const result = await leaveCircle(circleId);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      toast(`You left ${circleName}`, "success");
      router.push("/circles");
      router.refresh();
    });
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-fg-muted">Leave this circle?</span>
        <Button
          variant="destructive"
          size="sm"
          isLoading={isPending}
          disabled={isPending}
          onClick={handleLeave}
        >
          Confirm
        </Button>
        <Button variant="ghost" size="sm" disabled={isPending} onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
      <LogOut className="h-4 w-4" aria-hidden />
      Leave circle
    </Button>
  );
}

type CircleRemoveMemberButtonProps = {
  circleId: string;
  userId: string;
  userName: string;
};

export function CircleRemoveMemberButton({
  circleId,
  userId,
  userName,
}: CircleRemoveMemberButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    startTransition(async () => {
      const result = await removeCircleMember(circleId, userId);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      toast(`Removed ${userName} from the circle`, "success");
      router.refresh();
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      isLoading={isPending}
      onClick={handleRemove}
      aria-label={`Remove ${userName}`}
      title={`Remove ${userName}`}
    >
      <X className="h-4 w-4" aria-hidden />
    </Button>
  );
}

type CircleInviteMemberDialogProps = {
  circleId: string;
  invitableConnections: ConnectedUser[];
  maxInvites: number;
};

export function CircleInviteMemberDialog({
  circleId,
  invitableConnections,
  maxInvites,
}: CircleInviteMemberDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return invitableConnections;
    return invitableConnections.filter((connection) =>
      (connection.full_name ?? "").toLowerCase().includes(needle)
    );
  }, [invitableConnections, query]);

  const handleClose = () => {
    if (isPending) return;
    setOpen(false);
    setQuery("");
  };

  const handleInvite = (connection: ConnectedUser) => {
    setInvitingId(connection.id);
    startTransition(async () => {
      const result = await inviteToCircle(circleId, connection.id);
      setInvitingId(null);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      toast(`Invited ${connection.full_name ?? "them"}`, "success");
      router.refresh();
    });
  };

  if (maxInvites <= 0) return null;

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" aria-hidden />
        Invite someone
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        title="Invite someone to this circle"
        description="Only people from your connections who aren't already in this circle are shown."
      >
        <div className="space-y-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint"
              aria-hidden
            />
            <Input
              className="pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your connections"
              aria-label="Search your connections"
            />
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-border p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-fg-muted">
                {invitableConnections.length === 0
                  ? "Everyone in your connections is already in this circle, or you have no connections yet."
                  : `No connections match "${query}"`}
              </p>
            ) : (
              filtered.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-bg-hover"
                >
                  <Avatar
                    src={connection.avatar_url ?? undefined}
                    fallback={formatInitials(connection.full_name)}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-fg-primary">
                    {connection.full_name ?? "Builder"}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isPending}
                    isLoading={isPending && invitingId === connection.id}
                    onClick={() => handleInvite(connection)}
                  >
                    Invite
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
