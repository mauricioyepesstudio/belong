"use client";

import { createProject, joinProject } from "@/lib/actions/projects";
import { enableProjectFunding } from "@/lib/actions/billing";
import { formatCents, FundProjectModal } from "@/engines/billing";
import type { ProjectWithMemberCount, UserCommunity } from "@/lib/core";
import {
  Badge,
  Button,
  EmptyState,
  EntityCard,
  EntityGrid,
  FeatureScreen,
  Input,
  Label,
  Modal,
  ProgressBar,
  SearchField,
  Tabs,
  Textarea,
  useToast,
} from "@/systems/design-system";
import { StaggerItem, StaggerList } from "@/components/motion/fade-in";
import { FolderKanban, Plus, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type ProjectScreenProps = {
  projects: ProjectWithMemberCount[];
  discover: ProjectWithMemberCount[];
  communities: UserCommunity[];
  currentUserId: string;
};

const statusVariant: Record<string, "success" | "warning" | "outline" | "default"> = {
  active: "success",
  planning: "warning",
  completed: "default",
  archived: "outline",
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ProjectScreen({
  projects,
  discover,
  communities,
  currentUserId,
}: ProjectScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState("mine-active");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [fundProject, setFundProject] = useState<ProjectWithMemberCount | null>(null);
  const [fundingProjectId, setFundingProjectId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const minDeadline = todayIsoDate();

  const mineFiltered = useMemo(() => {
    const base =
      tab === "mine-active"
        ? projects.filter((p) => p.status === "active" || p.status === "planning")
        : projects;

    if (!query.trim() || tab === "discover") return base;
    const q = query.toLowerCase();
    return base.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.community?.name ?? "").toLowerCase().includes(q)
    );
  }, [tab, projects, query]);

  const discoverFiltered = useMemo(() => {
    const available = discover.filter((p) => !joinedIds.has(p.id));
    if (!query.trim()) return available;
    const q = query.toLowerCase();
    return available.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.community?.name ?? "").toLowerCase().includes(q)
    );
  }, [discover, query, joinedIds]);

  const activeCount = projects.filter(
    (p) => p.status === "active" || p.status === "planning"
  ).length;

  const list = tab === "discover" ? discoverFiltered : mineFiltered;

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      const result = await createProject({
        name: formData.get("name") as string,
        communityId: formData.get("communityId") as string,
        description: formData.get("description") as string,
        deadline: (formData.get("deadline") as string) || undefined,
      });
      if (result.error) toast(result.error, "error");
      else {
        toast("Project created", "success");
        setCreateOpen(false);
        if (result.id) router.push(`/projects/${result.id}`);
        else router.refresh();
      }
    });
  };

  const handleJoin = (projectId: string) => {
    startTransition(async () => {
      const result = await joinProject(projectId);
      if (result.error) toast(result.error, "error");
      else {
        toast("Joined project", "success");
        setJoinedIds((prev) => new Set(prev).add(projectId));
        setTab("mine");
        router.refresh();
      }
    });
  };

  const handleEnableFunding = (formData: FormData) => {
    if (!fundingProjectId) return;
    const goal = parseFloat(formData.get("goal") as string);
    if (Number.isNaN(goal) || goal < 5) {
      toast("Enter a valid funding goal of at least $5", "error");
      return;
    }
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

  const renderProjectCard = (project: ProjectWithMemberCount, mode: "mine" | "discover") => {
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
      <EntityCard
        icon={FolderKanban}
        title={project.name}
        description={project.description}
        href={`/projects/${project.id}`}
        badges={
          <Badge variant={statusVariant[project.status] ?? "outline"} className="capitalize">
            {project.status}
          </Badge>
        }
        meta={
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {project.community && <Badge variant="outline">{project.community.name}</Badge>}
              {project.funding_enabled && <Badge variant="brand">Funding</Badge>}
              <span className="text-micro text-fg-muted">
                {project.memberCount} member{project.memberCount === 1 ? "" : "s"}
                {project.deadline
                  ? ` · Due ${new Date(project.deadline).toLocaleDateString()}`
                  : ""}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-fg-muted">
                <span>Progress</span>
                <span>{project.progress}%</span>
              </div>
              <ProgressBar value={project.progress} animate={false} />
            </div>
            {project.funding_enabled && project.funding_goal_cents ? (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-fg-muted">
                  <span>Raised {formatCents(project.funding_raised_cents ?? 0)}</span>
                  <span>Goal {formatCents(project.funding_goal_cents)}</span>
                </div>
                <ProgressBar value={fundingProgress} animate={false} />
              </div>
            ) : null}
          </div>
        }
        footer={
          mode === "discover" ? (
            <Button
              size="sm"
              variant="brand"
              className="w-full"
              disabled={isPending}
              onClick={() => handleJoin(project.id)}
            >
              Join project
            </Button>
          ) : isOwner && !project.funding_enabled ? (
            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              disabled={isPending}
              onClick={() => setFundingProjectId(project.id)}
            >
              Enable funding
            </Button>
          ) : !isOwner && project.funding_enabled ? (
            <Button
              size="sm"
              variant="brand"
              className="w-full"
              disabled={isPending}
              onClick={() => setFundProject(project)}
            >
              <DollarSign className="h-3.5 w-3.5" aria-hidden />
              Back project
            </Button>
          ) : undefined
        }
      />
    );
  };

  return (
    <>
      <FeatureScreen
        label="Projects"
        title="Your projects"
        description="Track and collaborate on what you are building within your communities."
        action={
          <Button
            onClick={() => setCreateOpen(true)}
            disabled={communities.length === 0}
          >
            <Plus className="h-4 w-4" aria-hidden />
            New project
          </Button>
        }
        toolbar={
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              className="w-fit"
              tabs={[
                { id: "mine-active", label: "Active", count: activeCount },
                { id: "mine", label: "All mine", count: projects.length },
                { id: "discover", label: "Discover", count: discoverFiltered.length },
              ]}
              active={tab}
              onChange={setTab}
            />
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Search projects..."
              aria-label="Search projects"
              className="w-full sm:max-w-xs"
            />
          </div>
        }
      >
        {communities.length === 0 && (
          <EmptyState
            icon={FolderKanban}
            title="Join a community first"
            description="Projects belong to communities. Join or create a community before starting a project."
            action={{ label: "Browse communities", href: "/community" }}
            className="mb-6"
          />
        )}

        {list.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title={
              tab === "discover"
                ? "No projects to discover"
                : projects.length === 0
                  ? "No projects yet"
                  : "No matching projects"
            }
            description={
              tab === "discover"
                ? "Projects from your communities that you have not joined will appear here."
                : projects.length === 0
                  ? "Start your first project and invite collaborators to build together."
                  : "Try a different search or tab."
            }
            action={
              tab !== "discover" && communities.length > 0
                ? { label: "Create project", onClick: () => setCreateOpen(true) }
                : tab === "discover"
                  ? { label: "View your projects", onClick: () => setTab("mine-active") }
                  : undefined
            }
          />
        ) : (
          <StaggerList>
            <EntityGrid>
              {list.map((p) => (
                <StaggerItem key={p.id}>
                  {renderProjectCard(p, tab === "discover" ? "discover" : "mine")}
                </StaggerItem>
              ))}
            </EntityGrid>
          </StaggerList>
        )}
      </FeatureScreen>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New project"
        description="Define what you are building within a community."
      >
        <form action={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="communityId">Community</Label>
            <select
              id="communityId"
              name="communityId"
              required
              className="flex h-10 w-full rounded-xl border border-border-subtle bg-bg-surface px-3 text-sm text-fg-primary"
            >
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
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
            <Input id="deadline" name="deadline" type="date" min={minDeadline} />
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
