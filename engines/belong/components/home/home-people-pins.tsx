"use client";

import type { DiscoveryPerson } from "@/engines/opportunity";
import { sendConnectionRequest, startConversation } from "@/lib/actions/connections";
import type { UserConnectionState } from "@/lib/core/connection-state";
import { useSound } from "@/components/providers/sound-provider";
import { Avatar, Button, useToast } from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import { Clock, MapPin, MessageSquare, Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import styles from "./home-universe.module.css";

export function HomePeoplePins({ people }: { people: DiscoveryPerson[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const { play } = useSound();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [states, setStates] = useState<Map<string, UserConnectionState>>(new Map());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const connect = (person: DiscoveryPerson) => {
    setPendingId(person.id);
    startTransition(async () => {
      const result = await sendConnectionRequest(person.id);
      setPendingId(null);
      if (result.error) return toast(result.error, "error");
      setStates((current) => new Map(current).set(person.id, { id: result.id ?? null, state: "pending-sent" }));
      play("connection-sent");
      toast(`Connection request sent to ${person.fullName}`, "success", {
        label: "View profile",
        onClick: () => router.push(`/people/${person.id}`),
      });
    });
  };

  const message = (person: DiscoveryPerson) => {
    setPendingId(person.id);
    startTransition(async () => {
      const result = await startConversation(person.id);
      setPendingId(null);
      if (result.error || !result.id) return toast(result.error ?? "Could not open conversation", "error");
      router.push(`/messages?conversation=${result.id}`);
    });
  };

  return (
    <div className={styles.peoplePinsLayer} aria-label="People building around your world">
      <svg className={styles.peopleConnections} viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="people-line" x1="0" x2="1">
            <stop offset="0" stopColor="#8b5cf6" stopOpacity=".08" />
            <stop offset=".55" stopColor="#67e8f9" stopOpacity=".45" />
            <stop offset="1" stopColor="#22d3ee" stopOpacity=".08" />
          </linearGradient>
        </defs>
        {people.slice(0, 5).map((person, index) => (
          <path
            key={person.id}
            data-active={hoveredId === person.id || activeId === person.id}
            data-slot={index}
            d={[
              "M500 320 Q360 238 245 278",
              "M500 320 Q650 205 775 260",
              "M500 320 Q360 390 185 435",
              "M500 320 Q640 390 835 420",
              "M500 320 Q525 430 585 520",
            ][index]}
          />
        ))}
      </svg>
      {people.slice(0, 5).map((person, index) => {
        const connection = states.get(person.id) ?? person.connectionState;
        const open = activeId === person.id;
        return (
          <div key={person.id} className={styles.peoplePinSlot} data-slot={index}>
            <button
              type="button"
              className={styles.peoplePin}
              data-active={open}
              aria-expanded={open}
              aria-label={`Open ${person.fullName}'s preview`}
              onClick={() => setActiveId(open ? null : person.id)}
              onMouseEnter={() => setHoveredId(person.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <span className={styles.peoplePinPulse} aria-hidden />
              <span className={styles.peoplePinMarker}>
                <Avatar src={person.avatarUrl ?? undefined} fallback={formatInitials(person.fullName)} size="md" className={styles.peoplePinAvatar} />
                <span className={styles.peoplePinStem} aria-hidden />
              </span>
              <span className={styles.peoplePinName}>{person.fullName.split(" ")[0]}</span>
            </button>
            {open && (
              <div className={styles.peoplePinPopover} data-side={index === 1 || index === 3 ? "left" : "right"}>
                <div className="flex items-center gap-3">
                  <Avatar src={person.avatarUrl ?? undefined} fallback={formatInitials(person.fullName)} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{person.fullName}</p>
                    <p className="truncate text-xs text-white/55">{person.role ?? "BELONG builder"}</p>
                  </div>
                </div>
                {person.location && <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/55"><MapPin className="h-3.5 w-3.5" aria-hidden />{person.location}</p>}
                {person.matchReasons[0] && <p className="mt-2 text-[11px] leading-4 text-violet-100/75">{person.matchReasons[0]}</p>}
                {person.affinityScore > 0 && <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-cyan-200/75">{person.affinityScore}% affinity</p>}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link href={`/people/${person.id}`} className="inline-flex min-h-8 items-center justify-center gap-1 rounded-lg border border-white/10 px-2 text-[11px] font-semibold text-white/75 hover:bg-white/5">
                    <UserRound className="h-3.5 w-3.5" aria-hidden /> Profile
                  </Link>
                  {connection.state === "connected" ? (
                    <Button size="sm" variant="brand" disabled={pendingId === person.id} onClick={() => message(person)}><MessageSquare className="h-3.5 w-3.5" aria-hidden /> Message</Button>
                  ) : connection.state === "pending-sent" || connection.state === "pending-received" ? (
                    <Button size="sm" variant="secondary" disabled><Clock className="h-3.5 w-3.5" aria-hidden /> Pending</Button>
                  ) : (
                    <Button size="sm" variant="brand" disabled={pendingId === person.id} onClick={() => connect(person)}><Plus className="h-3.5 w-3.5" aria-hidden /> Connect</Button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
