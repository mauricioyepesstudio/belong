"use client";

import type { DiscoveryPerson } from "@/engines/opportunity";
import {
  sendConnectionRequest,
  startConversation,
} from "@/lib/actions/connections";
import { Avatar, Button, IconTile, useToast } from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import { ArrowRight, Clock, MapPin, MessageSquare, Plus, Users, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { GlassCard } from "../dashboard/primitives";
import type { UserConnectionState } from "@/lib/core/connection-state";

/**
 * Home suggestions carousel. Renders the same DiscoveryPerson[]
 * produced by discoverPeopleForHome (the exact scoring/filtering pipeline
 * behind /people/discover) — no separate matching logic lives here.
 */
export function HomeSuggestionsCarousel({ people }: { people: DiscoveryPerson[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [overrides, setOverrides] = useState<Map<string, UserConnectionState>>(new Map());
  const [passedIds, setPassedIds] = useState<Set<string>>(new Set());
  const visiblePeople = people.filter((person) => !passedIds.has(person.id));

  const handleConnect = (personId: string) => {
    startTransition(async () => {
      const result = await sendConnectionRequest(personId);
      if (result.error) {
        toast(result.error, "error");
      } else {
        setOverrides((prev) => new Map(prev).set(personId, { id: result.id ?? null, state: "pending-sent" }));
        const person = people.find((item) => item.id === personId);
        toast(
          `Connection request sent to ${person?.fullName ?? "this builder"}`,
          "success"
        );
      }
    });
  };

  const handleMessage = (personId: string) => {
    startTransition(async () => {
      const result = await startConversation(personId);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      router.push(`/messages?conversation=${result.id}`);
    });
  };

  return (
    <section aria-labelledby="suggestions-heading">
      <div className="mb-3 flex items-end justify-between gap-4 px-0.5">
        <div className="flex min-w-0 items-center gap-3">
          <IconTile icon={Users} className="shrink-0" />
          <div>
            <h2 id="suggestions-heading" className="text-sm font-semibold uppercase tracking-[0.08em] text-fg-primary sm:text-base">
              Suggestions for You
            </h2>
            <p className="mt-1 text-[11px] leading-4 text-fg-muted">People aligned with your purpose and energy.</p>
          </div>
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

      {visiblePeople.length === 0 ? (
        <GlassCard className="flex min-h-24 items-center justify-center px-5 py-4 text-center sm:min-h-28 sm:px-6 sm:py-5">
          <Link
            href="/people/discover"
            className="inline-flex min-h-9 items-center justify-center rounded-xl border border-violet-300/25 bg-violet-500/15 px-4 text-xs font-semibold text-violet-100 transition-colors hover:border-violet-300/40 hover:bg-violet-500/25 focus-ring sm:min-h-10 sm:px-5 sm:text-sm"
          >
            <span className="hidden sm:inline">Explore People</span>
            <span className="sm:hidden">Explore people →</span>
          </Link>
        </GlassCard>
      ) : (
        <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-2 snap-x snap-mandatory">
          {visiblePeople.map((person) => {
            const connection = overrides.get(person.id) ?? person.connectionState;
            const tags = person.tags.slice(0, 2);

            return (
              <GlassCard
                key={person.id}
                hover
                className="flex min-h-[190px] min-w-[42%] shrink-0 snap-start flex-col p-3 sm:min-w-[210px] lg:min-w-[calc((100%_-_3.125rem)/6)]"
              >
                <Link href={`/people/${person.id}`} className="block min-w-0 flex-1">
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
                    {person.nearYou && (
                      <p className="mt-1 flex items-center gap-1 text-micro text-emerald-300">
                        <MapPin className="h-3 w-3" aria-hidden /> Near you
                      </p>
                    )}
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
                  {person.matchReasons[0] && (
                    <p className="mt-1 line-clamp-2 text-micro text-fg-muted">{person.matchReasons[0]}</p>
                  )}
                </Link>

                <div className="mt-3 grid shrink-0 grid-cols-[auto_1fr] gap-2 border-t border-white/10 pt-2.5">
                  {connection.state === "none" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPassedIds((previous) => new Set(previous).add(person.id))}
                      aria-label={`Pass on ${person.fullName}`}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  ) : <span aria-hidden />}
                  <ConnectAction
                    state={connection.state}
                    disabled={isPending}
                    onConnect={() => handleConnect(person.id)}
                    onMessage={() => handleMessage(person.id)}
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
  onMessage,
  fullName,
}: {
  state: UserConnectionState["state"];
  disabled: boolean;
  onConnect: () => void;
  onMessage: () => void;
  fullName: string;
}) {
  if (state === "connected") {
    return (
      <Button
        size="sm"
        variant="secondary"
        disabled={disabled}
        onClick={onMessage}
        className="w-full justify-center"
      >
        <MessageSquare className="h-3.5 w-3.5" aria-hidden />
        Message
      </Button>
    );
  }

  if (state === "pending-sent" || state === "pending-received") {
    return (
      <Button size="sm" variant="secondary" disabled className="w-full justify-center">
        <Clock className="h-3.5 w-3.5" aria-hidden />
        Request sent
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
