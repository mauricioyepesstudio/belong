"use client";

import type { HomeActivity, HomeActivityType } from "@/engines/belong/home/types";
import { Avatar, Badge, ProgressBar } from "@/systems/design-system";
import { formatDistanceToNow, formatInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Award,
  Building2,
  CalendarDays,
  FolderKanban,
  Handshake,
  Lightbulb,
  MessageCircle,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { GlassCard } from "../dashboard/primitives";
import { ActivityReactions } from "./activity-reactions";

const TYPE_CONFIG: Record<
  HomeActivityType,
  { label: string; icon: LucideIcon; accent: string }
> = {
  post: { label: "Post", icon: MessageSquare, accent: "text-sky-300" },
  project: { label: "Project", icon: FolderKanban, accent: "text-indigo-300" },
  event: { label: "Event", icon: CalendarDays, accent: "text-emerald-300" },
  community: { label: "Community", icon: Users, accent: "text-brand" },
  organization: { label: "Organization", icon: Building2, accent: "text-fuchsia-300" },
  collaboration_request: {
    label: "Collaboration Request",
    icon: Handshake,
    accent: "text-cyan-300",
  },
  idea: { label: "Idea", icon: Lightbulb, accent: "text-amber-300" },
  achievement: { label: "Achievement", icon: Award, accent: "text-orange-300" },
};

function ActivityExtras({ activity }: { activity: HomeActivity }) {
  if (activity.type === "project" && activity.meta?.progress != null) {
    return (
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-caption text-fg-muted">
          <span>Progress</span>
          <span>{activity.meta.progress}%</span>
        </div>
        <ProgressBar value={Number(activity.meta.progress)} />
      </div>
    );
  }

  if (activity.type === "idea") {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand/10 px-3 py-2 text-caption text-brand">
        <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
        <span>Opportunity surfaced for your mission</span>
      </div>
    );
  }

  return null;
}

export function ActivityCard({ activity }: { activity: HomeActivity }) {
  const config = TYPE_CONFIG[activity.type];
  const Icon = config.icon;

  return (
    <GlassCard hover className="overflow-hidden">
      <article className="p-5 md:p-6">
        <div className="flex items-start gap-3">
          <Avatar
            src={activity.author.avatarUrl ?? undefined}
            fallback={formatInitials(activity.author.name)}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-fg-primary">{activity.author.name}</span>
              {activity.author.role && (
                <span className="text-caption text-fg-muted">{activity.author.role}</span>
              )}
              <span className="text-caption text-fg-faint">·</span>
              <span className="text-caption text-fg-muted">
                {formatDistanceToNow(activity.createdAt)}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1.5">
                <Icon className={cn("h-3 w-3", config.accent)} aria-hidden />
                {config.label}
              </Badge>
              {activity.intention && (
                <Badge variant="brand" className="capitalize">
                  {activity.intention}
                </Badge>
              )}
              {activity.contextLabel && (
                <span className="text-micro text-fg-faint">{activity.contextLabel}</span>
              )}
            </div>

            <Link href={activity.href} className="group mt-4 block">
              <h3 className="text-body-lg font-semibold text-fg-primary transition-colors group-hover:text-brand">
                {activity.title}
              </h3>
              {activity.body && (
                <p className="mt-2 whitespace-pre-wrap text-body leading-relaxed text-fg-secondary">
                  {activity.body}
                </p>
              )}
              {activity.excerpt && (
                <p className="mt-2 text-caption leading-relaxed text-fg-muted">{activity.excerpt}</p>
              )}
            </Link>

            <ActivityExtras activity={activity} />

            <div className="mt-5 space-y-4 border-t border-white/[0.06] pt-4">
              <ActivityReactions reactions={activity.reactions} compact />
              <div className="flex items-center gap-4 text-caption text-fg-muted">
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  {activity.commentCount} responses
                </span>
                {activity.impactPoints != null && activity.impactPoints > 0 && (
                  <span className="text-brand">+{activity.impactPoints} impact</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    </GlassCard>
  );
}
