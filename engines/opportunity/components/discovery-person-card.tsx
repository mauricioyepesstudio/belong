"use client";

import Link from "next/link";
import { Clock3, MapPin, MessageSquare, Sparkles, UserPlus } from "lucide-react";
import { Avatar, Badge, Button } from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DiscoveryPerson } from "@/engines/opportunity";
import type { UserConnectionState } from "@/lib/core/connection-state";
import { GlassCard } from "@/engines/belong/components/dashboard/primitives";

type DiscoveryPersonCardProps = {
  person: DiscoveryPerson;
  connection: UserConnectionState;
  isConnecting: boolean;
  onConnect: (person: DiscoveryPerson) => void;
  onMessage: (person: DiscoveryPerson) => void;
};

export function DiscoveryPersonCard({
  person,
  connection,
  isConnecting,
  onConnect,
  onMessage,
}: DiscoveryPersonCardProps) {
  const reasons = person.matchReasons.slice(0, 3);

  return (
    <GlassCard hover className="overflow-hidden">
      <Link
        href={`/people/${person.id}`}
        className="block p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
      >
        <div className="flex items-start gap-3">
          <Avatar
            src={person.avatarUrl ?? undefined}
            fallback={formatInitials(person.fullName)}
            size="lg"
            className="rounded-full"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-fg-primary">{person.fullName}</p>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-micro font-semibold text-emerald-300">
                {person.affinityScore}% aligned
              </span>
              <Badge variant="outline">
                {connection.state === "connected" ? "Connected" : connection.state === "none" ? "Recommended" : "Pending"}
              </Badge>
            </div>
            {person.role && (
              <p className="mt-0.5 truncate text-sm text-fg-muted">{person.role}</p>
            )}
            {person.location && (
              <p className="mt-1 flex items-center gap-1 truncate text-xs text-fg-muted">
                <MapPin className="h-3 w-3" aria-hidden />
                {person.location}
                {person.nearYou && <Badge variant="success">Near you</Badge>}
              </p>
            )}
          </div>
        </div>

        {person.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {person.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="border-border-subtle text-fg-secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-3 text-caption text-brand/90">
          <p className="flex items-center gap-1.5 font-semibold">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden /> Why this person?
          </p>
          {reasons.length > 0 ? (
            <ul className="mt-1.5 space-y-1 pl-5 text-fg-muted">
              {reasons.map((reason) => <li key={reason} className="list-disc">{reason}</li>)}
            </ul>
          ) : (
            <p className="mt-1.5 text-fg-muted">A real BELONG member open to discovery. Shared signals will appear as profiles grow.</p>
          )}
        </div>
      </Link>

      <div className="flex items-center justify-between gap-3 border-t border-border-subtle px-5 py-3">
        <span className="text-micro text-fg-faint">Open the card to view the profile</span>
        <Button
          type="button"
          size="sm"
          variant={
            connection.state === "none"
              ? "brand"
              : connection.state === "connected"
                ? "ghost"
                : "secondary"
          }
          disabled={isConnecting || connection.state === "pending-sent" || connection.state === "pending-received"}
          onClick={() => connection.state === "connected" ? onMessage(person) : onConnect(person)}
          aria-label={
            connection.state === "none"
              ? `Connect with ${person.fullName}`
              : connection.state === "connected"
                ? `Already connected with ${person.fullName}`
                : `Pending request with ${person.fullName}`
          }
          className={cn("shrink-0")}
        >
          {connection.state === "connected" ? (
            <>
              <MessageSquare className="h-3.5 w-3.5" aria-hidden />
              Message
            </>
          ) : connection.state === "pending-sent" || connection.state === "pending-received" ? (
            <><Clock3 className="h-3.5 w-3.5" aria-hidden />Request sent</>
          ) : (
            <>
              <UserPlus className="h-3.5 w-3.5" aria-hidden />
              Connect
            </>
          )}
        </Button>
      </div>
    </GlassCard>
  );
}
