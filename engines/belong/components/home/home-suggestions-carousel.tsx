"use client";

import type { DiscoveryPerson } from "@/engines/opportunity";
import { sendConnectionRequest } from "@/lib/actions/connections";
import { Avatar, Button, useToast } from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import { ArrowRight, Check, Clock, Plus } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { GlassCard, SectionHeader } from "../dashboard/primitives";
import type { UserConnectionState } from "@/lib/core/connection-state";

/**
 * "Sugerencias para ti" home carousel. Renders the same DiscoveryPerson[]
 * produced by discoverPeopleForHome (the exact scoring/filtering pipeline
 * behind /people/discover) — no separate matching logic lives here.
 */
export function HomeSuggestionsCarousel({ people }: { people: DiscoveryPerson[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [overrides, setOverrides] = useState<Map<string, UserConnectionState>>(new Map());

  if (people.length === 0) return null;

  const handleConnect = (personId: string) => {
    startTransition(async () => {
      const result = await sendConnectionRequest(personId);
      if (result.error) {
        toast(result.error, "error");
      } else {
        setOverrides((prev) => new Map(prev).set(personId, { id: result.id ?? null, state: "pending-sent" }));
        toast("Solicitud de conexión enviada", "success");
      }
    });
  };

  return (
    <section aria-labelledby="suggestions-heading">
      <SectionHeader
        label="Suggestions for you"
        title="People aligned with your goals, interests and communities."
        action={
          <Link
            href="/people/discover"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        }
      />

      <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
        {people.map((person) => {
          const connection = overrides.get(person.id) ?? person.connectionState;
          const tags = person.tags.slice(0, 2);

          return (
            <GlassCard
              key={person.id}
              hover
              className="min-w-[38%] shrink-0 snap-start p-3.5 sm:min-w-[220px]"
            >
              <Link href={person.profileSearchHref} className="block min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <Avatar
                    src={person.avatarUrl ?? undefined}
                    fallback={formatInitials(person.fullName)}
                    size="lg"
                  />
                  <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-emerald-300/25 bg-emerald-600/15 px-2 py-0.5 text-micro font-semibold text-emerald-300">
                    {person.affinityScore}% afinidad
                  </span>
                </div>

                <div className="mt-2.5 min-w-0">
                  <p className="truncate text-sm font-semibold text-fg-primary">{person.fullName}</p>
                  <p className="truncate text-micro text-fg-muted">{person.role ?? "Builder"}</p>
                </div>

                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="truncate rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-micro text-fg-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>

              <div className="mt-3 border-t border-white/10 pt-2.5">
                <ConnectAction
                  state={connection.state}
                  disabled={isPending}
                  onConnect={() => handleConnect(person.id)}
                  fullName={person.fullName}
                />
              </div>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
}

function ConnectAction({
  state,
  disabled,
  onConnect,
  fullName,
}: {
  state: UserConnectionState["state"];
  disabled: boolean;
  onConnect: () => void;
  fullName: string;
}) {
  if (state === "connected") {
    return (
      <Button size="sm" variant="ghost" disabled className="w-full justify-center">
        <Check className="h-3.5 w-3.5" aria-hidden />
        Connected
      </Button>
    );
  }

  if (state === "pending-sent" || state === "pending-received") {
    return (
      <Button size="sm" variant="secondary" disabled className="w-full justify-center">
        <Clock className="h-3.5 w-3.5" aria-hidden />
        Pending
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="brand"
      disabled={disabled}
      onClick={onConnect}
      className="w-full justify-center"
      aria-label={`Connect with ${fullName}`}
    >
      <Plus className="h-3.5 w-3.5" aria-hidden />
      Connect
    </Button>
  );
}
