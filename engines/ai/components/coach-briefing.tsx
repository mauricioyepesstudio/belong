"use client";

import type { DailyBriefing } from "@/engines/ai/briefing";
import { AICoach } from "@/engines/ai/components/ai-coach";
import type { AIInsight } from "@/engines/ai/types";
import { Avatar, Card, CardContent } from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import { Sparkles, UserPlus } from "lucide-react";
import Link from "next/link";

type CoachBriefingProps = {
  briefing: DailyBriefing;
  insights: AIInsight[];
};

export function CoachBriefing({ briefing, insights }: CoachBriefingProps) {
  return (
    <div className="space-y-4">
      <Card className="border-brand/20 bg-gradient-to-br from-brand/10 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15">
              <Sparkles className="h-5 w-5 text-brand" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-fg-primary">{briefing.greeting}</p>
              <p className="mt-2 text-sm leading-relaxed text-fg-secondary">{briefing.summary}</p>
              <p className="mt-3 text-xs font-medium text-brand">
                Today&apos;s focus: {briefing.focus}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {briefing.connectionSuggestions.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-fg-muted">
              <UserPlus className="h-3.5 w-3.5" aria-hidden />
              Suggested connections
            </p>
            <ul className="space-y-2">
              {briefing.connectionSuggestions.map((s) => (
                <li key={s.id}>
                  <Link
                    href={s.actionHref}
                    className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-bg-hover"
                  >
                    <Avatar
                      src={s.avatarUrl ?? undefined}
                      fallback={formatInitials(s.name)}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-fg-primary">{s.name}</p>
                      <p className="truncate text-xs text-fg-muted">{s.reason}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <AICoach insights={insights} compact title="Recommendations" />
    </div>
  );
}
