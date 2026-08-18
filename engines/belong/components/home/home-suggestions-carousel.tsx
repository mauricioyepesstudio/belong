"use client";

import type { DiscoveryPerson } from "@/engines/opportunity";
import { sendConnectionRequest } from "@/lib/actions/connections";
import { Avatar, Button, useToast } from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import { ArrowRight, Check, Clock, Plus } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { GlassCard } from "../dashboard/primitives";
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
      <div className="mb-3 flex items-end justify-between gap-4 px-0.5">
        <div className="min-w-0">
          <h2
            id="suggestions-heading"
            className="text-sm font-semibold uppercase tracking-[0.08em] text-fg-primary sm:text-base"
          >
            <span className="hidden sm:inline">Suggestions for You</span>
            <span className="sm:hidden">Sugerencias para ti</span>
          </h2>
          <p className="mt-1 text-[11px] leading-4 text-fg-muted">
            <span className="hidden sm:inline">People aligned with your purpose and energy.</span>
            <span className="sm:hidden">Personas alineadas con tus metas e intereses.</span>
          </p>
        </div>
        {people.length > 0 && (
          <Link
            href="/people/discover"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
      </div>

      {people.length === 0 ? (
        <GlassCard className="flex min-h-24 items-center justify-center px-5 py-4 text-center sm:min-h-28 sm:px-6 sm:py-5">
          <Link
            href="/people/discover"
            className="inline-flex min-h-9 items-center justify-center rounded-xl border border-violet-300/25 bg-violet-500/15 px-4 text-xs font-semibold text-violet-100 transition-colors hover:border-violet-300/40 hover:bg-violet-500/25 focus-ring sm:min-h-10 sm:px-5 sm:text-sm"
          >
            <span className="hidden sm:inline">Explore People</span>
            <span className="sm:hidden">Explorar personas →</span>
          </Link>
        </GlassCard>
      ) : (
        <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-2 snap-x snap-mandatory">
          {people.map((person) => {
            const connection = overrides.get(person.id) ?? person.connectionState;
            const tags = person.tags.slice(0, 2);

            return (
              <GlassCard
                key={person.id}
                hover
                className="flex min-h-[190px] min-w-[42%] shrink-0 snap-start flex-col p-3 sm:min-w-[210px] lg:min-w-[calc((100%_-_3.125rem)/6)]"
              >
                <Link href={person.profileSearchHref} className="block min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Avatar
                      src={person.avatarUrl ?? undefined}
                      fallback={formatInitials(person.fullName)}
                      size="lg"
                    />
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
                  <p className="mt-2 text-xs font-semibold text-fg-primary">
                    {person.affinityScore}% affinity
                  </p>
                </Link>

                <div className="mt-3 shrink-0 border-t border-white/10 pt-2.5">
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
      )}
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
