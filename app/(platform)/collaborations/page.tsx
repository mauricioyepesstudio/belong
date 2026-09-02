import { CollaborationRecordActions } from "@/components/features/collaboration/collaboration-record-actions";
import { listMyCollaborations } from "@/engines/impact/passport/data";
import type { CollaborationRecord } from "@/engines/impact/passport/types";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDistanceToNow, formatInitials } from "@/lib/format";
import { Avatar, Badge, Card, CardContent, EmptyState, FeatureScreen } from "@/systems/design-system";
import { Check, Clock3, Handshake } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Collaborations" };

export default async function CollaborationsPage() {
  const supabase = await createClient();
  const profile = await requireProfile();
  const { pendingSent, pendingReceived, confirmed } = await listMyCollaborations(
    supabase,
    profile.id
  );

  return (
    <FeatureScreen
      label="Impact passport"
      title="Collaborations"
      description="Two-sided confirmed records of who you have built with."
    >
      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-fg-muted">
            Awaiting your response
          </h2>
          {pendingReceived.length === 0 ? (
            <EmptyState
              icon={Handshake}
              title="Nothing waiting on you"
              description="When another builder proposes a collaboration with you, it will show up here to confirm or decline."
            />
          ) : (
            <div className="space-y-3">
              {pendingReceived.map((record) => (
                <CollaborationCard key={record.id} record={record} viewerId={profile.id}>
                  <CollaborationRecordActions recordId={record.id} mode="respond" />
                </CollaborationCard>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-fg-muted">
            Pending — sent
          </h2>
          {pendingSent.length === 0 ? (
            <EmptyState
              icon={Clock3}
              title="No pending proposals"
              description="Collaboration records you propose to other builders will stay here until they respond."
            />
          ) : (
            <div className="space-y-3">
              {pendingSent.map((record) => (
                <CollaborationCard key={record.id} record={record} viewerId={profile.id}>
                  <CollaborationRecordActions recordId={record.id} mode="cancel" />
                </CollaborationCard>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-fg-muted">
            Confirmed
          </h2>
          {confirmed.length === 0 ? (
            <EmptyState
              icon={Check}
              title="No confirmed collaborations yet"
              description="Once both people confirm a collaboration, it becomes a permanent part of your impact passport."
            />
          ) : (
            <div className="space-y-3">
              {confirmed.map((record) => (
                <CollaborationCard key={record.id} record={record} viewerId={profile.id} />
              ))}
            </div>
          )}
        </section>
      </div>
    </FeatureScreen>
  );
}

function CollaborationCard({
  record,
  viewerId,
  children,
}: {
  record: CollaborationRecord;
  viewerId: string;
  children?: ReactNode;
}) {
  const other = record.proposer.id === viewerId ? record.partner : record.proposer;
  const dateLabel =
    record.status === "confirmed" ? record.respondedAt ?? record.updatedAt : record.proposedAt;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <Avatar
            src={other.avatarUrl ?? undefined}
            fallback={formatInitials(other.fullName)}
          />
          <div className="min-w-0">
            <p className="font-medium text-fg-primary">{other.fullName}</p>
            <p className="mt-1 text-sm text-fg-secondary">{record.summary}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
              <span>{formatDistanceToNow(dateLabel)}</span>
              {record.context.projectName && (
                <Badge variant="outline">{record.context.projectName}</Badge>
              )}
              {record.context.communityName && (
                <Badge variant="outline">{record.context.communityName}</Badge>
              )}
            </div>
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
