"use client";

import type { HomeEngineData } from "@/engines/belong/data";
import { ScrollReveal } from "@/components/motion/fade-in";
import { Badge, Button } from "@/systems/design-system";
import { Users } from "lucide-react";
import Link from "next/link";
import { GlassCard, SectionHeader } from "./primitives";

export function CommunitiesRow({
  communities,
  onJoinCommunity,
}: {
  communities: HomeEngineData["communities"];
  onJoinCommunity: () => void;
}) {
  return (
    <ScrollReveal delay={0.1}>
      <section>
        <SectionHeader
          label="My Communities"
          title="Where you belong"
          action={
            <Link
              href="/community"
              className="text-sm text-fg-muted transition-colors hover:text-brand"
            >
              Explore →
            </Link>
          }
        />

        {communities.length === 0 ? (
          <GlassCard className="flex flex-col items-center p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
              <Users className="h-6 w-6 text-fg-muted" aria-hidden />
            </div>
            <p className="text-body-lg mt-6 max-w-sm text-fg-muted">
              Purpose-aligned communities multiply what you can achieve alone.
            </p>
            <div className="mt-8">
              <Button variant="brand" className="rounded-2xl px-6" onClick={onJoinCommunity}>
                Join Community
              </Button>
            </div>
          </GlassCard>
        ) : (
          <div className="-mx-1 flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
            {communities.map((c) => (
              <Link key={c.id} href="/community" className="snap-start shrink-0">
                <GlassCard
                  hover
                  className="group flex h-full w-[280px] flex-col p-6 transition-transform duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand/20 to-indigo-500/10">
                      <Users className="h-5 w-5 text-brand" aria-hidden />
                    </div>
                    <Badge variant="outline" className="shrink-0 capitalize">
                      {c.role}
                    </Badge>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-fg-primary transition-colors group-hover:text-brand">
                    {c.name}
                  </h3>
                  {c.description && (
                    <p className="mt-2 flex-1 text-caption line-clamp-2">{c.description}</p>
                  )}
                  {c.tag && (
                    <p className="mt-4 text-micro text-fg-faint">{c.tag}</p>
                  )}
                </GlassCard>
              </Link>
            ))}
          </div>
        )}
      </section>
    </ScrollReveal>
  );
}
