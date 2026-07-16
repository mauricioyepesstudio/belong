"use client";

import type { BelongGraphData, GraphNode } from "@/engines/graph/types";
import { Card, CardContent } from "@/systems/design-system";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Network } from "lucide-react";

const TYPE_COLORS: Record<GraphNode["type"], string> = {
  user: "bg-brand/20 text-brand border-brand/30",
  project: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  community: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  event: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  skill: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  goal: "bg-pink-500/20 text-pink-300 border-pink-500/30",
};

export function BelongGraph({ data }: { data: BelongGraphData }) {
  const center = data.nodes.find((n) => n.id === data.centerId);
  const orbit = data.nodes.filter((n) => n.id !== data.centerId).slice(0, 8);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center gap-2">
          <Network className="h-5 w-5 text-brand" aria-hidden />
          <h2 className="text-sm font-semibold text-fg-primary">BELONG Graph</h2>
        </div>

        <div className="relative mx-auto flex h-56 w-full max-w-sm items-center justify-center">
          {orbit.map((node, i) => {
            const angle = (i / orbit.length) * Math.PI * 2 - Math.PI / 2;
            const x = 50 + Math.cos(angle) * 38;
            const y = 50 + Math.sin(angle) * 38;
            const inner = (
              <span
                className={cn(
                  "block max-w-[72px] truncate rounded-lg border px-2 py-1 text-[10px] font-medium",
                  TYPE_COLORS[node.type]
                )}
                title={node.label}
              >
                {node.label}
              </span>
            );
            return (
              <div
                key={node.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                {node.href ? <Link href={node.href}>{inner}</Link> : inner}
              </div>
            );
          })}
          {center && (
            <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
              <span className="rounded-xl border border-brand/40 bg-brand/15 px-3 py-2 text-xs font-semibold text-brand">
                {center.label}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-5 gap-2 text-center text-micro text-fg-muted">
          <div>
            <p className="font-semibold text-fg-primary">{data.stats.people}</p>
            <p>People</p>
          </div>
          <div>
            <p className="font-semibold text-fg-primary">{data.stats.projects}</p>
            <p>Projects</p>
          </div>
          <div>
            <p className="font-semibold text-fg-primary">{data.stats.communities}</p>
            <p>Groups</p>
          </div>
          <div>
            <p className="font-semibold text-fg-primary">{data.stats.events}</p>
            <p>Events</p>
          </div>
          <div>
            <p className="font-semibold text-fg-primary">{data.stats.skills}</p>
            <p>Skills</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
