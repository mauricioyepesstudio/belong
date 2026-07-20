"use client";

import type { HomeActivity, HomeActivityType } from "@/engines/belong/home/types";
import { Avatar, Badge, ProgressBar } from "@/systems/design-system";
import { formatDistanceToNow, formatInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  CalendarDays,
  FolderKanban,
  Handshake,
  ImageIcon,
  Lightbulb,
  MessageCircle,
  Play,
  Sparkles,
  Target,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { GlassCard } from "../dashboard/primitives";
import { ActivityReactions } from "./activity-reactions";

const TYPE_CONFIG: Record<
  HomeActivityType,
  { label: string; icon: LucideIcon; accent: string }
> = {
  thought: { label: "Thought", icon: Lightbulb, accent: "text-amber-300" },
  image: { label: "Image", icon: ImageIcon, accent: "text-pink-300" },
  video: { label: "Video", icon: Video, accent: "text-rose-300" },
  article: { label: "Article", icon: BookOpen, accent: "text-sky-300" },
  poll: { label: "Poll", icon: BarChart3, accent: "text-violet-300" },
  project: { label: "Project", icon: FolderKanban, accent: "text-indigo-300" },
  event: { label: "Event", icon: CalendarDays, accent: "text-emerald-300" },
  collaboration: { label: "Collaboration", icon: Handshake, accent: "text-cyan-300" },
  opportunity: { label: "Opportunity", icon: Target, accent: "text-orange-300" },
  community_update: { label: "Community", icon: Users, accent: "text-brand" },
  organization_update: { label: "Organization", icon: Building2, accent: "text-fuchsia-300" },
  ai_recommendation: { label: "AI Recommendation", icon: Bot, accent: "text-brand" },
};

function ActivityMedia({ activity }: { activity: HomeActivity }) {
  if (activity.type === "image") {
    return (
      <div className="mt-4 overflow-hidden rounded-2xl border border-border-subtle bg-gradient-to-br from-brand/10 via-indigo-500/10 to-bg-surface">
        <div className="flex aspect-[16/9] items-center justify-center">
          <ImageIcon className="h-10 w-10 text-fg-faint" aria-hidden />
        </div>
      </div>
    );
  }

  if (activity.type === "video") {
    return (
      <div className="mt-4 overflow-hidden rounded-2xl border border-border-subtle bg-gradient-to-br from-rose-500/10 to-bg-surface">
        <div className="relative flex aspect-video items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
            <Play className="ml-0.5 h-6 w-6 text-fg-primary" aria-hidden />
          </div>
        </div>
      </div>
    );
  }

  if (activity.type === "poll" && activity.pollOptions?.length) {
    const total = activity.pollOptions.reduce((sum, opt) => sum + opt.votes, 0);
    return (
      <div className="mt-4 space-y-2">
        {activity.pollOptions.map((option) => {
          const pct = total ? Math.round((option.votes / total) * 100) : 0;
          return (
            <div key={option.label} className="rounded-xl border border-border-subtle bg-white/[0.02] p-3">
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="text-fg-secondary">{option.label}</span>
                <span className="text-caption text-fg-muted">{pct}%</span>
              </div>
              <ProgressBar value={pct} className="h-1.5" />
            </div>
          );
        })}
      </div>
    );
  }

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
              {activity.purpose && (
                <Badge variant="brand" className="capitalize">
                  {activity.purpose}
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
              {activity.excerpt && activity.type === "article" && (
                <p className="mt-2 text-caption leading-relaxed text-fg-muted">{activity.excerpt}…</p>
              )}
              {activity.excerpt && activity.type !== "article" && (
                <p className="mt-2 text-caption text-fg-muted">{activity.excerpt}</p>
              )}
            </Link>

            <ActivityMedia activity={activity} />

            {activity.type === "ai_recommendation" && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand/10 px-3 py-2 text-caption text-brand">
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                <span>Curated by BELONG AI for your mission</span>
              </div>
            )}

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
