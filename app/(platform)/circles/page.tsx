import Link from "next/link";
import type { Metadata } from "next";
import { Flame, Users, Target } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseServerClient } from "@/lib/core/types";
import { getAcceptedConnections } from "@/lib/data/connections";
import {
  CIRCLE_MAX_MEMBERS,
  checkinStreakWeeks,
  isLiveCircle,
  listCheckinDatesByCircle,
  listMyCircles,
  type AccountabilityCircle,
} from "@/engines/circles";
import { CreateCircleDialog } from "@/engines/circles/components/create-circle-dialog";
import { CircleInviteActions } from "@/engines/circles/components/circle-invite-actions";
import { Avatar, Badge, Card, CardContent, EmptyState, FeatureScreen } from "@/systems/design-system";
import { formatInitials } from "@/lib/format";

export const metadata: Metadata = { title: "Circles" };

type PendingCircleInvite = {
  circleId: string;
  name: string;
  goalDescription: string;
  creatorName: string;
  creatorAvatarUrl: string | null;
};

/**
 * listMyCircles() only returns circles the caller is an *active* member or
 * creator of (see engines/circles/data.ts), so it deliberately excludes
 * circles the caller has been invited to but not yet accepted. This reads
 * that separate slice directly -- read-only, RLS-scoped the same way -- so
 * the "Pending invites" section has something to show.
 */
async function listPendingCircleInvites(
  supabase: SupabaseServerClient,
  userId: string
): Promise<PendingCircleInvite[]> {
  const { data: inviteRows } = await supabase
    .from("accountability_circle_members")
    .select("circle_id, created_at")
    .eq("user_id", userId)
    .eq("status", "invited");
  if (!inviteRows?.length) return [];

  const circleIds = [...new Set(inviteRows.map((row) => row.circle_id))];
  const { data: circleRows } = await supabase
    .from("accountability_circles")
    .select("id, name, goal_description, creator_id, created_at")
    .in("id", circleIds);
  if (!circleRows?.length) return [];

  const creatorIds = [...new Set(circleRows.map((row) => row.creator_id))];
  const { data: creators } = await supabase
    .from("users")
    .select("id, full_name, avatar_url")
    .in("id", creatorIds);
  const creatorMap = new Map((creators ?? []).map((user) => [user.id, user]));

  return [...circleRows]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((row) => {
      const creator = creatorMap.get(row.creator_id);
      return {
        circleId: row.id,
        name: row.name,
        goalDescription: row.goal_description,
        creatorName: creator?.full_name ?? "A builder",
        creatorAvatarUrl: creator?.avatar_url ?? null,
      };
    });
}

export default async function CirclesPage() {
  const supabase = await createClient();
  const profile = await requireProfile();

  const [circles, connections, pendingInvites] = await Promise.all([
    listMyCircles(supabase, profile.id),
    getAcceptedConnections(),
    listPendingCircleInvites(supabase, profile.id),
  ]);
  const vitality = await loadCircleVitality(supabase, circles);

  return (
    <FeatureScreen
      label="Accountability"
      title="Circles"
      description="Small, private groups built around one shared, concrete goal."
      action={<CreateCircleDialog connections={connections} />}
    >
      <div className="space-y-8">
        {pendingInvites.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-fg-muted">
              Pending invites
            </h2>
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <Card key={invite.circleId}>
                  <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <Avatar
                        src={invite.creatorAvatarUrl ?? undefined}
                        fallback={formatInitials(invite.creatorName)}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-fg-primary">{invite.name}</p>
                        <p className="mt-1 text-sm text-fg-secondary">{invite.goalDescription}</p>
                        <p className="mt-2 text-xs text-fg-muted">
                          Invited by {invite.creatorName}
                        </p>
                      </div>
                    </div>
                    <CircleInviteActions circleId={invite.circleId} circleName={invite.name} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-fg-muted">
            My circles
          </h2>
          {circles.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No circles yet"
              description="Create a circle with a few people you trust and hold each other accountable to one shared goal."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {circles.map((circle) => (
                <CircleCard
                  key={circle.id}
                  circle={circle}
                  vitality={vitality.get(circle.id) ?? { streak: 0, live: false }}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </FeatureScreen>
  );
}

type CircleVitality = { streak: number; live: boolean };

/**
 * Weekly check-in streak and "live" status per circle (the north-star metric
 * in docs/cerebro/vision-proposito.md). Reads six weeks of check-ins: enough
 * for a 4-week streak plus the week in progress.
 */
async function loadCircleVitality(
  supabase: SupabaseServerClient,
  circles: AccountabilityCircle[]
): Promise<Map<string, CircleVitality>> {
  const now = new Date();
  const since = new Date(now.getTime() - 6 * 7 * 24 * 60 * 60 * 1000);
  const datesByCircle = await listCheckinDatesByCircle(
    supabase,
    circles.map((circle) => circle.id),
    since
  );
  return new Map(
    circles.map((circle) => {
      const checkinDates = datesByCircle.get(circle.id) ?? [];
      const activeMemberCount = circle.members.filter((m) => m.status === "active").length;
      return [
        circle.id,
        {
          streak: checkinStreakWeeks(checkinDates, now),
          live: isLiveCircle({ activeMemberCount, checkinDates }, now),
        },
      ];
    })
  );
}

function CircleCard({
  circle,
  vitality: { streak, live },
}: {
  circle: AccountabilityCircle;
  vitality: CircleVitality;
}) {
  const visibleMembers = circle.members
    .filter((member) => member.status === "active" || member.status === "invited")
    .slice(0, 4);
  const overflow = circle.memberCount - visibleMembers.length;

  return (
    <Link href={`/circles/${circle.id}`} className="block">
      <Card className="h-full transition-colors hover:border-border-strong">
        <CardContent className="flex h-full flex-col gap-4 pt-5">
          <div className="min-w-0">
            <p className="font-medium text-fg-primary">{circle.name}</p>
            <p className="mt-1 line-clamp-2 text-sm text-fg-secondary">{circle.goalDescription}</p>
          </div>
          <div className="mt-auto flex items-center justify-between">
            <div className="flex -space-x-2">
              {visibleMembers.map((member) => (
                <Avatar
                  key={member.id}
                  src={member.user.avatarUrl ?? undefined}
                  fallback={formatInitials(member.user.fullName)}
                  size="sm"
                  className="ring-2 ring-bg-elevated"
                />
              ))}
              {overflow > 0 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-bg-hover text-xs font-medium text-fg-muted ring-2 ring-bg-elevated">
                  +{overflow}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {streak > 0 && (
                <Badge variant={live ? "success" : "outline"}>
                  <Flame className="mr-1 h-3 w-3" aria-hidden />
                  {live ? "Live" : `${streak} wk`}
                </Badge>
              )}
              <Badge variant="outline">
                <Users className="mr-1 h-3 w-3" aria-hidden />
                {circle.memberCount}/{CIRCLE_MAX_MEMBERS}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
