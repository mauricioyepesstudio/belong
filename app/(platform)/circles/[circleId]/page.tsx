import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, MessageCircle, Target } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getAcceptedConnections } from "@/lib/data/connections";
import { CIRCLE_MAX_MEMBERS, canInvite, isAtCapacity, listCircleCheckins } from "@/engines/circles";
import {
  CircleInviteMemberDialog,
  CircleLeaveButton,
  CircleRemoveMemberButton,
} from "@/components/features/circles/circle-detail-actions";
import { CheckinComposer } from "@/components/features/circles/checkin-composer";
import { CheckinFeed } from "@/components/features/circles/checkin-feed";
import { Avatar, Badge, Button, Card, CardContent, EmptyState } from "@/systems/design-system";
import { formatInitials } from "@/lib/format";

type CirclePageProps = {
  params: Promise<{ circleId: string }>;
};

export const metadata: Metadata = { title: "Circle" };

export default async function CircleDetailPage({ params }: CirclePageProps) {
  const { circleId } = await params;
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: circle } = await supabase
    .from("accountability_circles")
    .select("id, name, goal_description, creator_id")
    .eq("id", circleId)
    .maybeSingle();
  if (!circle) notFound();

  const [{ data: memberRows }, checkins] = await Promise.all([
    supabase
      .from("accountability_circle_members")
      .select("id, user_id, role, status, joined_at, created_at")
      .eq("circle_id", circleId)
      .order("created_at", { ascending: true }),
    listCircleCheckins(supabase, circleId),
  ]);
  const rows = memberRows ?? [];

  const viewerRow = rows.find((row) => row.user_id === profile.id);
  if (!viewerRow) notFound();

  const memberIds = rows.map((row) => row.user_id);
  const { data: users } = memberIds.length
    ? await supabase.from("users").select("id, full_name, avatar_url, role").in("id", memberIds)
    : { data: [] as { id: string; full_name: string | null; avatar_url: string | null; role: string | null }[] };
  const userMap = new Map((users ?? []).map((user) => [user.id, user]));

  const members = rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    fullName: userMap.get(row.user_id)?.full_name ?? "Builder",
    avatarUrl: userMap.get(row.user_id)?.avatar_url ?? null,
  }));

  const memberCount = members.filter((m) => m.status === "active" || m.status === "invited").length;
  const isOwner = circle.creator_id === profile.id;
  const viewerCanInvite = canInvite(
    { creatorId: circle.creator_id },
    { userId: profile.id, status: viewerRow.status }
  );
  const atCapacity = isAtCapacity(memberCount);
  const remainingSlots = Math.max(0, CIRCLE_MAX_MEMBERS - memberCount);

  const connections = viewerCanInvite && !atCapacity ? await getAcceptedConnections() : [];
  const memberIdSet = new Set(memberIds);
  const invitableConnections = connections.filter((connection) => !memberIdSet.has(connection.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/circles">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
        </Link>
        <p className="text-label">Circle</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-display text-fg-primary">{circle.name}</h1>
          <div className="mt-3 flex items-start gap-2 text-body-lg text-fg-secondary">
            <Target className="mt-1 h-4 w-4 shrink-0" aria-hidden />
            <span>{circle.goal_description}</span>
          </div>
          <Badge variant="outline" className="mt-3">
            {memberCount}/{CIRCLE_MAX_MEMBERS} members
          </Badge>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {viewerCanInvite && (
            <CircleInviteMemberDialog
              circleId={circle.id}
              invitableConnections={invitableConnections}
              maxInvites={remainingSlots}
            />
          )}
          {viewerRow.status === "active" && (
            <CircleLeaveButton circleId={circle.id} circleName={circle.name} />
          )}
        </div>
      </div>

      <Card>
        <CardContent className="space-y-1 pt-5">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-lg px-2 py-2.5 first:pt-0"
            >
              <Avatar
                src={member.avatarUrl ?? undefined}
                fallback={formatInitials(member.fullName)}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg-primary">
                  {member.fullName}
                  {member.userId === profile.id && (
                    <span className="ml-1.5 text-fg-muted">(you)</span>
                  )}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {member.role === "owner" && <Badge variant="brand">Owner</Badge>}
                  <Badge variant={member.status === "active" ? "success" : "warning"}>
                    {member.status === "active" ? "Active" : "Invited"}
                  </Badge>
                </div>
              </div>
              {isOwner && member.userId !== profile.id && (
                <CircleRemoveMemberButton
                  circleId={circle.id}
                  userId={member.userId}
                  userName={member.fullName}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-fg-muted">
          Check-ins
        </h2>
        {viewerRow.status === "active" && (
          <Card>
            <CardContent className="pt-5">
              <CheckinComposer circleId={circle.id} />
            </CardContent>
          </Card>
        )}
        {checkins.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No check-ins yet"
            description="Be the first to share an update with this circle."
          />
        ) : (
          <CheckinFeed checkins={checkins} viewerId={profile.id} />
        )}
      </section>
    </div>
  );
}
