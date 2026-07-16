"use client";

import type { CoachRecommendation } from "@/engines/belong/recommendation";
import { ScrollReveal } from "@/components/motion/fade-in";
import { Button } from "@/systems/design-system";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { GlassCard } from "./primitives";

export function CoachCard({
  recommendation,
}: {
  recommendation: CoachRecommendation;
}) {
  return (
    <ScrollReveal delay={0.05}>
      <section>
        <GlassCard
          glow
          className="relative overflow-hidden p-8 md:p-10 lg:p-12"
        >
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/10 blur-[80px]"
            aria-hidden
          />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-16">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15">
                  <Sparkles className="h-5 w-5 text-brand" aria-hidden />
                </div>
                <p className="text-label">AI Coach</p>
              </div>

              <h2 className="text-heading-lg mt-8 max-w-xl text-fg-primary">
                {recommendation.title}
              </h2>
              <p className="text-body-lg mt-4 max-w-xl leading-relaxed">
                {recommendation.description}
              </p>

              <Link href={recommendation.actionHref} className="mt-10 inline-block">
                <Button
                  size="xl"
                  variant="primary"
                  className="h-12 rounded-2xl px-7 font-semibold"
                >
                  {recommendation.actionLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
            </div>

            <div className="flex flex-col justify-center">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
                <p className="text-label text-fg-muted">Why this matches you</p>
                <p className="text-body mt-4 leading-relaxed text-fg-secondary">
                  {recommendation.why}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </section>
    </ScrollReveal>
  );
}
