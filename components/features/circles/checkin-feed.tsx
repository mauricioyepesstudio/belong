"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { deleteCircleCheckin } from "@/lib/actions/circles";
import { canDeleteCheckin, type CircleCheckin } from "@/engines/circles";
import { Avatar, Button, Card, CardContent, useToast } from "@/systems/design-system";
import { formatDistanceToNow, formatInitials } from "@/lib/format";

type CheckinFeedProps = {
  checkins: CircleCheckin[];
  viewerId: string;
};

/**
 * There is no stored "day" field on a check-in -- group headers are derived
 * client-side from createdAt so the feed still reads as a cadence of
 * check-ins without the backend needing to track one.
 */
function formatDayLabel(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

function groupByDay(checkins: CircleCheckin[]): { label: string; items: CircleCheckin[] }[] {
  const groups: { label: string; items: CircleCheckin[] }[] = [];
  for (const checkin of checkins) {
    const label = formatDayLabel(checkin.createdAt);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.label === label) {
      lastGroup.items.push(checkin);
    } else {
      groups.push({ label, items: [checkin] });
    }
  }
  return groups;
}

export function CheckinFeed({ checkins, viewerId }: CheckinFeedProps) {
  if (checkins.length === 0) return null;

  const groups = groupByDay(checkins);

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.label} className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-fg-muted">
            {group.label}
          </h3>
          <Card>
            <CardContent className="space-y-1 pt-5">
              {group.items.map((checkin) => (
                <CheckinRow
                  key={checkin.id}
                  checkin={checkin}
                  canDelete={canDeleteCheckin({ authorId: checkin.author.id }, viewerId)}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

type CheckinRowProps = {
  checkin: CircleCheckin;
  canDelete: boolean;
};

function CheckinRow({ checkin, canDelete }: CheckinRowProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCircleCheckin(checkin.id);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex items-start gap-3 rounded-lg px-2 py-2.5 first:pt-0">
      <Avatar
        src={checkin.author.avatarUrl ?? undefined}
        fallback={formatInitials(checkin.author.fullName)}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-sm font-medium text-fg-primary">{checkin.author.fullName}</p>
          <span className="shrink-0 text-xs text-fg-muted">
            {formatDistanceToNow(checkin.createdAt)}
          </span>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm text-fg-secondary">{checkin.body}</p>
      </div>
      {canDelete &&
        (confirming ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              variant="destructive"
              size="xs"
              isLoading={isPending}
              disabled={isPending}
              onClick={handleDelete}
            >
              Confirm
            </Button>
            <Button
              variant="ghost"
              size="xs"
              disabled={isPending}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            disabled={isPending}
            onClick={() => setConfirming(true)}
            aria-label="Delete check-in"
            title="Delete check-in"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        ))}
    </div>
  );
}
