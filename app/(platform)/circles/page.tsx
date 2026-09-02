import Link from "next/link";
import type { Metadata } from "next";
import { Users, Target } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseServerClient } from "@/lib/core/types";
import { getAcceptedConnections } from "@/lib/data/connections";
import { CIRCLE_MAX_MEMBERS, listMyCircles, type AccountabilityCircle } from "@/engines/circles";
import { CreateCircleDialog } from "@/components/features/circles/create-circle-dialog";
import { CircleInviteActions } from "@/components/features/circles/circle-invite-actions";
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
                <CircleCard key={circle.id} circle={circle} />
              ))}
            </div>
          )}
        </section>
      </div>
    </FeatureScreen>
  );
}

function CircleCard({ circle }: { circle: AccountabilityCircle }) {
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
            <Badge variant="outline">
              <Users className="mr-1 h-3 w-3" aria-hidden />
              {circle.memberCount}/{CIRCLE_MAX_MEMBERS}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
