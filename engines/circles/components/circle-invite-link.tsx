"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Link2, LogIn } from "lucide-react";
import { joinCircleByInviteCode, setCircleInviteLink } from "@/lib/actions/circles";
import { Button, Card, CardContent, useToast } from "@/systems/design-system";
import { circleInvitePath } from "../invite-link";

const noopSubscribe = () => () => {};

/** Browser origin on the client, empty during server render (avoids touching window on the server). */
function useOrigin(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => ""
  );
}

type CircleInviteLinkCardProps = {
  circleId: string;
  initialCode: string | null;
  atCapacity: boolean;
};

/** Owner-only card to turn a shareable join link on, copy it, or turn it off. */
export function CircleInviteLinkCard({ circleId, initialCode, atCapacity }: CircleInviteLinkCardProps) {
  const { toast } = useToast();
  const [code, setCode] = useState(initialCode);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const origin = useOrigin();

  const link = code ? `${origin}${circleInvitePath(code)}` : null;

  const toggle = (enabled: boolean) => {
    startTransition(async () => {
      const result = await setCircleInviteLink(circleId, enabled);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      setCode(result.code ?? null);
      setCopied(false);
      toast(enabled ? "Invite link is on" : "Invite link turned off", "success");
    });
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      toast("Could not copy the link", "error");
    }
  };

  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-fg-muted" aria-hidden />
          <p className="text-sm font-medium text-fg-primary">Invite with a link</p>
        </div>
        <p className="text-sm text-fg-secondary">
          Share this link with your group, class or team. Anyone signed in to BELONG can join
          until the circle is full.
        </p>
        {link ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 truncate rounded-md border border-border-subtle bg-bg-surface px-3 py-2 text-xs text-fg-secondary">
              {link}
            </code>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={copy} disabled={isPending}>
                {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                {copied ? "Copied" : "Copy link"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toggle(false)} isLoading={isPending}>
                Turn off
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggle(true)}
            isLoading={isPending}
            disabled={isPending || atCapacity}
          >
            <Link2 className="h-4 w-4" aria-hidden />
            {atCapacity ? "Circle is full" : "Create invite link"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/** Join button on the /circles/join/[code] page. */
export function JoinCircleButton({ code, disabled }: { code: string; disabled?: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const join = () => {
    startTransition(async () => {
      const result = await joinCircleByInviteCode(code);
      if (result.error || !result.circleId) {
        toast(result.error ?? "Could not join this circle", "error");
        return;
      }
      toast("Welcome to the circle", "success");
      router.push(`/circles/${result.circleId}`);
      router.refresh();
    });
  };

  return (
    <Button onClick={join} isLoading={isPending} disabled={isPending || disabled}>
      <LogIn className="h-4 w-4" aria-hidden />
      Join this circle
    </Button>
  );
}
