"use client";

import type { CoachRecommendation } from "@/engines/belong/recommendation";
import type { SmartHomeItem } from "@/engines/belong/creator-os";
import { ScrollReveal } from "@/components/motion/fade-in";
import { Badge } from "@/systems/design-system";
import {
  Bell,
  FolderKanban,
  Sparkles,
  Target,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { GlassCard, SectionHeader } from "./primitives";

const kindConfig: Record<
  SmartHomeItem["kind"],
  { icon: LucideIcon; label: string }
> = {
  mission: { icon: Target, label: "Mission" },
  project: { icon: FolderKanban, label: "Project" },
  community: { icon: Users, label: "Community" },
  notification: { icon: Bell, label: "Notifications" },
  person: { icon: UserPlus, label: "Suggested" },
};

export function SmartHome({
  recommendation,
  items,
}: {
  recommendation: CoachRecommendation;
  items: SmartHomeItem[];
}) {
  const primary = items[0];

  return (
    <ScrollReveal>
      <section id="smart-home">
        <SectionHeader
          label="Smart Home"
          title="What should I do now?"
          action={
            <Link
              href="/search"
              className="text-sm text-fg-muted transition-colors hover:text-brand"
            >
              Search everything →
            </Link>
          }
        />

        <GlassCard glow className="overflow-hidden">
          <div className="border-b border-white/[0.06] p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/15">
                <Sparkles className="h-6 w-6 text-brand" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-label text-brand">Recommended next step</p>
                <h3 className="text-heading-md mt-1 text-fg-primary">
                  {recommendation.title}
                </h3>
                <p className="text-body mt-2 text-fg-secondary">{recommendation.description}</p>
                <p className="mt-3 text-caption text-fg-muted">{recommendation.why}</p>
                <Link
                  href={recommendation.actionHref}
                  className="mt-5 inline-flex items-center rounded-2xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  {recommendation.actionLabel} →
                </Link>
              </div>
            </div>
          </div>

          {items.length > 0 && (
            <div className="divide-y divide-white/[0.06]">
              {items.map((item) => {
                const config = kindConfig[item.kind];
                const Icon = config.icon;
                const isPrimary = primary?.id === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-start gap-4 p-5 transition-colors hover:bg-white/[0.02]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]">
                      <Icon className="h-4 w-4 text-fg-muted" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-micro">
                          {config.label}
                        </Badge>
                        {isPrimary && (
                          <Badge variant="brand" className="text-micro">
                            Top priority
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-medium text-fg-primary">{item.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-caption">{item.description}</p>
                    </div>
                    <span className="shrink-0 text-sm text-brand">{item.actionLabel} →</span>
                  </Link>
                );
              })}
            </div>
          )}
        </GlassCard>
      </section>
    </ScrollReveal>
  );
}
