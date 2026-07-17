"use client";

import type { CrossModuleLink } from "@/engines/belong/creator-os";
import { ScrollReveal } from "@/components/motion/fade-in";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { GlassCard } from "./primitives";

export function CrossModuleNav({ links }: { links: CrossModuleLink[] }) {
  return (
    <ScrollReveal delay={0.05}>
      <nav aria-label="Cross-module navigation">
        <GlassCard className="flex flex-wrap items-stretch divide-x divide-white/[0.06] overflow-hidden">
          {links.map((link, index) => (
            <Link
              key={link.label}
              href={link.href}
              className="group flex min-w-[140px] flex-1 flex-col gap-1 p-4 transition-colors hover:bg-white/[0.03] sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-fg-primary">{link.label}</span>
                <ChevronRight
                  className="h-4 w-4 text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
                  aria-hidden
                />
              </div>
              <span className="line-clamp-2 text-caption text-fg-muted">{link.description}</span>
              {index < links.length - 1 && (
                <span className="sr-only">Next: {links[index + 1]?.label}</span>
              )}
            </Link>
          ))}
        </GlassCard>
      </nav>
    </ScrollReveal>
  );
}
