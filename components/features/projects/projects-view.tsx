"use client";

import { createProject } from "@/lib/actions/projects";
import { enableProjectFunding } from "@/lib/actions/billing";
import { formatCents, FundProjectModal } from "@/engines/billing";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  FeatureScreen,
  Input,
  Label,
  Modal,
  ProgressBar,
  Tabs,
  Textarea,
  useToast,
} from "@/systems/design-system";
import type { Project } from "@/types/database.types";
import { FolderKanban, Plus, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type ProjectItem = Project & { memberCount: number };

export function ProjectsView({
  projects,
  currentUserId,
}: {
  projects: ProjectItem[];
  currentUserId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState("active");
  const [createOpen, setCreateOpen] = useState(false);
  const [fundProject, setFundProject] = useState<ProjectItem | null>(null);
  const [fundingProjectId, setFundingProjectId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () => (tab === "active" ? projects.filter((p) => p.status === "active") : projects),
    [tab, projects]
  );

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      const result = await createProject({
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        deadline: (formData.get("deadline") as string) || undefined,
      });
      if (result.error) toast(result.error, "error");
      else {
        toast("Project created", "success");
        setCreateOpen(false);
        router.refresh();
      }
    });
  };

  const handleEnableFunding = (formData: FormData) => {
    if (!fundingProjectId) return;
    const goal = parseFloat(formData.get("goal") as string);
    const cents = Math.round(goal * 100);
    startTransition(async () => {
      const result = await enableProjectFunding(fundingProjectId, cents);
      if (result.error) toast(result.error, "error");
      else {
        toast("Funding enabled", "success");
        setFundingProjectId(null);
        router.refresh();
      }
    });
  };

  return (
    <>
      <FeatureScreen
        label="Projects"
        title="Your projects"
        description="Track and collaborate on what you are building."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            New project
          </Button>
        }
        toolbar={
          <Tabs
            className="w-fit"
            tabs={[
              { id: "active", label: "Active", count: projects.filter((p) => p.status === "active").length },
              { id: "all", label: "All", count: projects.length },
            ]}
            active={tab}
            onChange={setTab}
          />
        }
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Start your first project and invite collaborators to build together."
            action={{ label: "Create project", onClick: () => setCreateOpen(true) }}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((project) => {
              const isOwner = project.owner_id === currentUserId;
              const fundingProgress =
                project.funding_goal_cents && project.funding_goal_cents > 0
                  ? Math.min(
                      100,
                      Math.round(
                        ((project.funding_raised_cents ?? 0) / project.funding_goal_cents) * 100
                      )
                    )
                  : 0;

              return (
              <Card
                key={project.id}
                className="transition-all hover:border-border-strong hover:bg-bg-surface"
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-fg-primary">{project.name}</h3>
                        <Badge
                          variant={
                            project.status === "active"
                              ? "success"
                              : project.status === "planning"
                                ? "warning"
                                : "outline"
                          }
                        >
                          {project.status}
                        </Badge>
                        {project.funding_enabled && (
                          <Badge variant="brand">Funding</Badge>
                        )}
                      </div>
                      {project.description && (
                        <p className="mt-1 text-sm text-fg-muted line-clamp-2">{project.description}</p>
                      )}
                      <p className="mt-1 text-caption">
                        {project.memberCount} members
                        {project.deadline
                          ? ` · Due ${new Date(project.deadline).toLocaleDateString()}`
                          : ""}
                      </p>
                      {project.funding_enabled && (
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-xs text-fg-muted">
                            <span>Raised {formatCents(project.funding_raised_cents ?? 0)}</span>
                            {project.funding_goal_cents ? (
                              <span>Goal {formatCents(project.funding_goal_cents)}</span>
                            ) : null}
                          </div>
                          {project.funding_goal_cents ? (
                            <ProgressBar value={fundingProgress} animate={false} />
                          ) : null}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      <ProgressBar value={project.progress} className="sm:w-48" animate={false} />
                      {isOwner && !project.funding_enabled && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setFundingProjectId(project.id)}
                        >
                          Enable funding
                        </Button>
                      )}
                      {!isOwner && project.funding_enabled && (
                        <Button
                          size="sm"
                          variant="brand"
                          onClick={() => setFundProject(project)}
                        >
                          <DollarSign className="h-3.5 w-3.5" aria-hidden />
                          Back project
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
        )}
      </FeatureScreen>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New project"
        description="Define what you are building."
      >
        <form action={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project name</Label>
            <Input id="name" name="name" required placeholder="My project" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="What are you building?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (optional)</Label>
            <Input id="deadline" name="deadline" type="date" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending}>
              Create project
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(fundingProjectId)}
        onClose={() => setFundingProjectId(null)}
        title="Enable project funding"
        description="Set a funding goal and accept contributions via Stripe."
      >
        <form action={handleEnableFunding} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal">Funding goal (USD)</Label>
            <Input id="goal" name="goal" type="number" min="5" step="1" required placeholder="1000" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setFundingProjectId(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" isLoading={isPending}>
              Enable
            </Button>
          </div>
        </form>
      </Modal>

      {fundProject && (
        <FundProjectModal
          open={Boolean(fundProject)}
          onClose={() => setFundProject(null)}
          project={fundProject}
        />
      )}
    </>
  );
}
