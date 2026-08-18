"use client";

import Link from "next/link";
import { Check, Sparkles, UserPlus } from "lucide-react";
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
};

export function DiscoveryPersonCard({
  person,
  connection,
  isConnecting,
  onConnect,
}: DiscoveryPersonCardProps) {
  const topReason = person.matchReasons[0] ?? null;

  return (
    <GlassCard hover className="overflow-hidden">
      <Link
        href={person.profileSearchHref}
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
                {person.affinityScore}% afinidad
              </span>
            </div>
            {person.role && (
              <p className="mt-0.5 truncate text-sm text-fg-muted">{person.role}</p>
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

        {topReason && (
          <p className="mt-3 flex items-start gap-1.5 text-caption text-brand/90">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{topReason}</span>
          </p>
        )}
      </Link>

      <div className="flex items-center justify-between gap-3 border-t border-border-subtle px-5 py-3">
        <span className="text-micro text-fg-faint">Toca la tarjeta para ver el perfil</span>
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
          disabled={isConnecting || connection.state !== "none"}
          onClick={() => onConnect(person)}
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
              <Check className="h-3.5 w-3.5" aria-hidden />
              Connected
            </>
          ) : connection.state === "pending-sent" || connection.state === "pending-received" ? (
            "Pending"
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
