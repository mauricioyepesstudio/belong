"use client";

import type { HomeEngineData } from "@/engines/belong/data";
import { ScrollReveal } from "@/components/motion/fade-in";
import { Badge, Button, EmptyState } from "@/systems/design-system";
import { formatDistanceToNow } from "@/lib/format";
import { FolderKanban, Users } from "lucide-react";
import Link from "next/link";
import { GlassCard, SectionHeader } from "./primitives";

const statusVariant: Record<string, "brand" | "outline" | "default"> = {
  active: "brand",
  planning: "outline",
  completed: "default",
  archived: "default",
};

export function ProjectsRow({
  projects,
  currentUserId,
  onNewProject,
}: {
  projects: HomeEngineData["recentProjects"];
  currentUserId: string;
  onNewProject: () => void;
}) {
  return (
    <ScrollReveal delay={0.08}>
      <section>
        <SectionHeader
          label="Projects"
          title="What you're building"
          action={
            <Link
              href="/projects"
              className="text-sm text-fg-muted transition-colors hover:text-brand"
            >
              View all →
            </Link>
          }
        />

        {projects.length === 0 ? (
          <GlassCard>
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Start your first project and invite collaborators to build together."
              action={{ label: "Create project", onClick: onNewProject }}
              className="border-0 bg-transparent py-12"
            />
          </GlassCard>
        ) : (
          <div className="-mx-1 flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
            {projects.map((project) => {
              const isOwner = project.owner_id === currentUserId;
              return (
                <Link key={project.id} href="/projects" className="snap-start shrink-0">
                  <GlassCard
                    hover
                    className="group flex h-full w-[280px] flex-col p-6 transition-transform duration-300 hover:scale-[1.02]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand/20 to-indigo-500/10">
                        <FolderKanban className="h-5 w-5 text-brand" aria-hidden />
                      </div>
                      <Badge variant={statusVariant[project.status] ?? "outline"} className="shrink-0 capitalize">
                        {project.status}
                      </Badge>
                    </div>
                    <h3 className="mt-6 text-lg font-semibold text-fg-primary transition-colors group-hover:text-brand">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="mt-2 flex-1 text-caption line-clamp-2">{project.description}</p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-micro text-fg-faint">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" aria-hidden />
                        {project.memberCount} member{project.memberCount === 1 ? "" : "s"}
                      </span>
                      {isOwner && <span>Owner</span>}
                      <span>Updated {formatDistanceToNow(project.updated_at)}</span>
                    </div>
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        )}

        {projects.length > 0 && (
          <div className="mt-4 flex justify-end">
            <Button variant="ghost" size="sm" onClick={onNewProject} className="text-fg-muted hover:text-brand">
              <FolderKanban className="h-4 w-4" aria-hidden />
              New project
            </Button>
          </div>
        )}
      </section>
    </ScrollReveal>
  );
}
