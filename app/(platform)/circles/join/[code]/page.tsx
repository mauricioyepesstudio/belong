import Link from "next/link";
import type { Metadata } from "next";
import { Link2Off, Target, Users } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { CIRCLE_MAX_MEMBERS, isAtCapacity, normalizeCircleInviteCode } from "@/engines/circles";
import { JoinCircleButton } from "@/engines/circles/components/circle-invite-link";
import { Badge, Button, Card, CardContent, EmptyState } from "@/systems/design-system";

type JoinCirclePageProps = {
  params: Promise<{ code: string }>;
};

export const metadata: Metadata = { title: "Join a circle" };

export default async function JoinCirclePage({ params }: JoinCirclePageProps) {
  const { code: rawCode } = await params;
  const code = normalizeCircleInviteCode(rawCode);
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: previews } = code
    ? await supabase.rpc("circle_invite_preview", { p_code: code })
    : { data: null };
  const preview = previews?.[0];

  if (!code || !preview) {
    return (
      <EmptyState
        icon={Link2Off}
        title="This invite link is not active"
        description="Ask the person who shared it for a new link."
        action={{ label: "Go to your circles", href: "/circles" }}
      />
    );
  }

  const { data: membership } = await supabase
    .from("accountability_circle_members")
    .select("status")
    .eq("circle_id", preview.circle_id)
    .eq("user_id", profile.id)
    .maybeSingle();
  const alreadyActive = membership?.status === "active";
  const full = !membership && isAtCapacity(preview.member_count);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <p className="text-label">You are invited to a circle</p>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h1 className="text-display text-fg-primary">{preview.name}</h1>
          <div className="flex items-start gap-2 text-body-lg text-fg-secondary">
            <Target className="mt-1 h-4 w-4 shrink-0" aria-hidden />
            <span>{preview.goal_description}</span>
          </div>
          <Badge variant="outline">
            <Users className="h-3.5 w-3.5" aria-hidden />
            {preview.member_count}/{CIRCLE_MAX_MEMBERS} members
          </Badge>
          <p className="text-sm text-fg-muted">
            A circle is a small group that checks in every week on one shared goal.
          </p>
          <div className="pt-2">
            {alreadyActive ? (
              <Link href={`/circles/${preview.circle_id}`}>
                <Button>Open the circle</Button>
              </Link>
            ) : full ? (
              <p className="text-sm font-medium text-fg-secondary">This circle is full.</p>
            ) : (
              <JoinCircleButton code={code} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
