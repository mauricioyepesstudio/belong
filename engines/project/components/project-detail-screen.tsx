"use client";

import {
  createProjectPost,
  joinProject,
  leaveProject,
  refreshProjectDetail,
  updateProject,
} from "@/lib/actions/projects";
import { enableProjectFunding } from "@/lib/actions/billing";
import { uploadPostImage } from "@/lib/actions/platform";
import { formatCents, FundProjectModal } from "@/engines/billing";
import { ProjectPostFeed } from "./project-post-feed";
import { ProjectOverviewTab } from "./workspace/overview-tab";
import { ProjectActivityTab } from "./workspace/activity-tab";
import { ProjectTasksTab } from "./workspace/tasks-tab";
import { ProjectMembersTab } from "./workspace/members-tab";
import { ProjectFilesTab } from "./workspace/files-tab";
import { ProjectDiscussionsTab } from "./workspace/discussions-tab";
import { ProjectGoalsTab } from "./workspace/goals-tab";
import { ProjectAnalyticsTab } from "./workspace/analytics-tab";
import type { ProjectDetail, ProjectMember, ProjectPostWithMeta } from "@/lib/core";
import {
  Badge,
  Button,
  Card,
  CardContent,
  FeatureScreen,
  Input,
  Label,
  Modal,
  ProgressBar,
  Tabs,
  Textarea,
  useToast,
} from "@/systems/design-system";
import { ArrowLeft, DollarSign, FolderKanban } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { ProjectStatus } from "@/types/database.types";
import type { CopilotPanelData } from "@/lib/data/ai-copilot";
import { SegmentErrorBoundary } from "@/components/error/segment-error-boundary";
import { CopilotPanel } from "@/engines/ai/components/copilot-panel";
import {
  AnalyticsScreen,
  AnalyticsSource,
  trackClientEvent,
} from "@/systems/analytics";
import {
  dedupeById,
  fetchAuthorMeta,
  mapProjectActivityRow,
  mapProjectDiscussionRow,
  mapProjectPostRow,
  mapProjectTaskRow,
  useProjectRealtime,
} from "@/engines/core/realtime";

type CurrentUser = {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
};

type ProjectDetailScreenProps = {
  data: ProjectDetail;
  copilot: CopilotPanelData;
  currentUser: CurrentUser;
};

const statusVariant: Record<ProjectStatus, "success" | "warning" | "outline" | "default"> = {
  planning: "warning",
  active: "success",
  completed: "default",
  archived: "outline",
};

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export function ProjectDetailScreen({ data, copilot, currentUser }: ProjectDetailScreenProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState("overview");
  const [postBody, setPostBody] = useState("");
  const [postImageUrl, setPostImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fundOpen, setFundOpen] = useState(false);
  const [backOpen, setBackOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { project, community, owner } = data;
  const [editName, setEditName] = useState(project.name);
  const [editDescription, setEditDescription] = useState(project.description ?? "");
  const [editDeadline, setEditDeadline] = useState(project.deadline ?? "");
  const [posts, setPosts] = useState(data.posts);
  const [membership, setMembership] = useState(data.membership);
  const [memberCount, setMemberCount] = useState(data.memberCount);
  const [members, setMembers] = useState(data.members);
  const [workspace, setWorkspace] = useState(data.workspace);
  const [progress, setProgress] = useState(project.progress);
  const [status, setStatus] = useState(project.status);
  const [fundingEnabled, setFundingEnabled] = useState(project.funding_enabled);

  const openedProjectRef = useRef<string | null>(null);
  useEffect(() => {
    if (openedProjectRef.current === project.id) return;
    openedProjectRef.current = project.id;
    void trackClientEvent({
      name: "project_opened",
      userId: currentUser.id,
      screen: AnalyticsScreen.PROJECT_DETAIL,
      source: AnalyticsSource.PROJECT_DETAIL,
      entityId: project.id,
    });
  }, [project.id, currentUser.id]);

  const isMember = Boolean(membership);
  const isOwner = project.owner_id === currentUser.id;
  const isAdmin = membership?.role === "admin" || isOwner;
  const isCommunityMember = data.communityMembers.some(
    (member) => member.userId === currentUser.id
  );

  const fundingProgress =
    project.funding_goal_cents && project.funding_goal_cents > 0
      ? Math.min(
          100,
          Math.round(((project.funding_raised_cents ?? 0) / project.funding_goal_cents) * 100)
        )
      : 0;

  const syncFromServer = useCallback(async () => {
    const fresh = await refreshProjectDetail(project.id);
    if (!fresh) return;
    setPosts(fresh.posts);
    setMembership(fresh.membership);
    setMemberCount(fresh.memberCount);
    setMembers(fresh.members);
    setWorkspace(fresh.workspace);
    setProgress(fresh.project.progress);
    setStatus(fresh.project.status);
    setFundingEnabled(fresh.project.funding_enabled);
  }, [project.id]);

  useProjectRealtime({
    projectId: project.id,
    userId: currentUser.id,
    userName: currentUser.fullName,
    onPostInsert: (row) => {
      void fetchAuthorMeta(String(row.author_id)).then((author) => {
        const post = mapProjectPostRow(row, author);
        setPosts((prev) => dedupeById(prev, post));
      });
    },
    onCommentInsert: (row) => {
      const postId = String(row.post_id);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, commentCount: post.commentCount + 1 }
            : post
        )
      );
    },
    onLikeInsert: (row) => {
      const postId = String(row.post_id);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, likeCount: post.likeCount + 1 } : post
        )
      );
    },
    onMemberInsert: () => setMemberCount((count) => count + 1),
    onMemberDelete: () => setMemberCount((count) => Math.max(0, count - 1)),
    onTaskInsert: (row) => {
      const task = mapProjectTaskRow(row);
      setWorkspace((prev) => ({
        ...prev,
        tasks: dedupeById(prev.tasks, task),
        analytics: {
          ...prev.analytics,
          totalTasks: prev.analytics.totalTasks + 1,
        },
      }));
    },
    onTaskUpdate: (row) => {
      const task = mapProjectTaskRow(row);
      setWorkspace((prev) => {
        const wasDone = prev.tasks.find((t) => t.id === task.id)?.status === "done";
        const isDone = task.status === "done";
        let completedTasks = prev.analytics.completedTasks;
        if (!wasDone && isDone) completedTasks += 1;
        if (wasDone && !isDone) completedTasks = Math.max(0, completedTasks - 1);
        return {
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === task.id ? { ...t, ...task } : t)),
          analytics: { ...prev.analytics, completedTasks },
        };
      });
    },
    onActivityInsert: (row) => {
      const item = mapProjectActivityRow(row);
      setWorkspace((prev) => ({
        ...prev,
        activity: dedupeById(prev.activity, item),
      }));
    },
    onDiscussionInsert: (row) => {
      const discussion = mapProjectDiscussionRow(row);
      setWorkspace((prev) => ({
        ...prev,
        discussions: dedupeById(prev.discussions, discussion),
      }));
    },
    onDiscussionReplyInsert: (row) => {
      const discussionId = String(row.discussion_id);
      setWorkspace((prev) => ({
        ...prev,
        discussions: prev.discussions.map((d) =>
          d.id === discussionId
            ? {
                ...d,
                replies: [
                  ...d.replies,
                  {
                    id: String(row.id),
                    discussionId,
                    authorId: String(row.author_id),
                    parentReplyId: row.parent_reply_id ? String(row.parent_reply_id) : null,
                    content: String(row.content),
                    createdAt: String(row.created_at),
                    authorName: null,
                    authorAvatar: null,
                  },
                ],
              }
            : d
        ),
      }));
    },
    onGoalUpdate: (row) => {
      const goalId = String(row.id);
      setWorkspace((prev) => ({
        ...prev,
        goals: prev.goals.map((g) =>
          g.id === goalId
            ? {
                ...g,
                progressPercent: Number(row.progress_percent ?? g.progressPercent),
                status: (row.status as typeof g.status) ?? g.status,
              }
            : g
        ),
      }));
    },
    onProjectUpdate: (row) => {
      if (row.progress !== undefined) setProgress(Number(row.progress));
      if (row.status) setStatus(row.status as ProjectStatus);
    },
  });

  const handleJoin = () => {
    startTransition(async () => {
      const result = await joinProject(project.id);
      if (result.error) toast(result.error, "error");
      else {
        toast("Joined project", "success");
        setMembership({ role: "member", joinedAt: new Date().toISOString() });
        setMemberCount((count) => count + 1);
        if (!members.some((m) => m.userId === currentUser.id)) {
          const member: ProjectMember = {
            key: `temp-${currentUser.id}`,
            userId: currentUser.id,
            role: "member",
            joinedAt: new Date().toISOString(),
            fullName: currentUser.fullName,
            avatarUrl: currentUser.avatarUrl,
            bio: null,
          };
          setMembers((prev) => [...prev, member]);
        }
        router.refresh();
        void syncFromServer();
      }
    });
  };

  const handleLeave = () => {
    startTransition(async () => {
      const result = await leaveProject(project.id);
      if (result.error) toast(result.error, "error");
      else {
        toast("Left project", "success");
        setMembership(null);
        setMemberCount((count) => Math.max(0, count - 1));
        setMembers((prev) => prev.filter((m) => m.userId !== currentUser.id));
        router.refresh();
        void syncFromServer();
      }
    });
  };

  const handlePost = () => {
    if (!postBody.trim()) return;
    startTransition(async () => {
      const result = await createProjectPost(project.id, postBody.trim(), postImageUrl);
      if (result.error) toast(result.error, "error");
      else if (result.post) {
        toast("Update published", "success");
        setPostBody("");
        setPostImageUrl(null);
        setPosts((prev) => [result.post!, ...prev]);
        router.refresh();
        void syncFromServer();
      }
    });
  };

  const handlePostImage = (file: File | null) => {
    if (!file) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.set("image", file);
    startTransition(async () => {
      const result = await uploadPostImage(formData);
      setUploadingImage(false);
      if (result.error) toast(result.error, "error");
      else if (result.url) {
        setPostImageUrl(result.url);
        toast("Image attached", "success");
      }
    });
  };

  const handlePostUpdate = (postId: string, updated: ProjectPostWithMeta) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
  };

  const handleSaveProjectEdit = () => {
    startTransition(async () => {
      const result = await updateProject(project.id, {
        name: editName,
        description: editDescription,
        deadline: editDeadline || null,
      });
      if (result.error) toast(result.error, "error");
      else {
        toast("Project updated", "success");
        setEditOpen(false);
        router.refresh();
        void syncFromServer();
      }
    });
  };

  const handleStatusChange = (nextStatus: ProjectStatus) => {
    if (!isOwner) return;
    const previousStatus = status;
    setStatus(nextStatus);
    startTransition(async () => {
      const result = await updateProject(project.id, { status: nextStatus });
      if (result.error) {
        toast(result.error, "error");
        setStatus(previousStatus);
      } else {
        toast("Status updated", "success");
        router.refresh();
      }
    });
  };

  const handleEnableFunding = (formData: FormData) => {
    const goal = parseFloat(formData.get("goal") as string);
    if (Number.isNaN(goal) || goal < 5) {
      toast("Enter a valid funding goal of at least $5", "error");
      return;
    }
    const cents = Math.round(goal * 100);
    startTransition(async () => {
      const result = await enableProjectFunding(project.id, cents);
      if (result.error) toast(result.error, "error");
      else {
        toast("Funding enabled", "success");
        setFundOpen(false);
        setFundingEnabled(true);
        router.refresh();
        void syncFromServer();
      }
    });
  };

  return (
    <>
      <FeatureScreen
        label="Project"
        title={project.name}
        description={project.description ?? undefined}
        action={
          <Link href="/projects">
            <Button variant="ghost" className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              All projects
            </Button>
          </Link>
        }
      >
        <Card id="project-membership" className="relative scroll-mt-24 overflow-hidden border-brand/20 bg-[radial-gradient(circle_at_18%_12%,rgba(139,92,246,0.14),transparent_38%),linear-gradient(145deg,rgba(15,15,35,0.96),rgba(6,5,20,0.98))] shadow-[0_28px_80px_-48px_var(--brand-glow)]">
          <div
            className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-brand/10 blur-3xl"
            aria-hidden
          />
          <CardContent className="relative space-y-5 pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/25 to-brand-secondary/10 shadow-[0_0_30px_-12px_var(--brand-glow)]">
                  <FolderKanban className="h-7 w-7 text-brand" aria-hidden />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant[status]} className="capitalize">
                      {status}
                    </Badge>
                    {membership && (
                      <Badge
                        variant={membership.role === "owner" ? "brand" : "outline"}
                        className="capitalize"
                      >
                        {membership.role}
                      </Badge>
                    )}
                    {!membership && <Badge variant="outline">Visitor</Badge>}
                    {fundingEnabled && <Badge variant="brand">Funding</Badge>}
                    <Link href={`/community/${community.slug}`}>
                      <Badge variant="outline">{community.name}</Badge>
                    </Link>
                  </div>
                  <p className="mt-2 text-caption text-fg-muted">
                    {memberCount} member{memberCount === 1 ? "" : "s"}
                    {owner && <> · Owned by {owner.full_name ?? "Builder"}</>}
                    {project.deadline && (
                      <> · Due {new Date(project.deadline).toLocaleDateString()}</>
                    )}
                  </p>
                  <ProgressBar value={progress} animate={false} className="mt-4 max-w-sm" />
                  {fundingEnabled && project.funding_goal_cents && (
                    <div className="mt-3 max-w-xs space-y-1">
                      <div className="flex justify-between text-xs text-fg-muted">
                        <span>Raised {formatCents(project.funding_raised_cents ?? 0)}</span>
                        <span>Goal {formatCents(project.funding_goal_cents)}</span>
                      </div>
                      <ProgressBar value={fundingProgress} animate={false} />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:items-end">
                {isOwner && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
                      Edit details
                    </Button>
                    {statusOptions.map((option) => (
                      <Button
                        key={option.value}
                        size="sm"
                        variant={status === option.value ? "brand" : "secondary"}
                        disabled={isPending}
                        onClick={() => handleStatusChange(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {!isMember && isCommunityMember && (
                    <Button disabled={isPending} onClick={handleJoin} className="w-full sm:w-auto">
                      Join project
                    </Button>
                  )}
                  {!isMember && !isCommunityMember && (
                    <Link href={`/community/${community.slug}`} className="w-full sm:w-auto">
                      <Button variant="brand" className="w-full sm:w-auto">
                        Join {community.name} first
                      </Button>
                    </Link>
                  )}
                  {isMember && !isOwner && (
                    <Button
                      variant="secondary"
                      disabled={isPending}
                      onClick={handleLeave}
                      className="w-full sm:w-auto"
                    >
                      Leave
                    </Button>
                  )}
                  {isOwner && !fundingEnabled && (
                    <Button
                      variant="secondary"
                      disabled={isPending}
                      onClick={() => setFundOpen(true)}
                      className="w-full sm:w-auto"
                    >
                      Enable funding
                    </Button>
                  )}
                  {!isOwner && fundingEnabled && (
                    <Button
                      variant="brand"
                      disabled={isPending}
                      onClick={() => setBackOpen(true)}
                      className="w-full sm:w-auto"
                    >
                      <DollarSign className="h-4 w-4" aria-hidden />
                      Back project
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isMember && (
          <SegmentErrorBoundary title="Copilot unavailable">
            <CopilotPanel
              contextType="project"
              contextId={project.id}
              contextName={project.name}
              canUse={copilot.canUse}
              canApply={copilot.canApply}
              recentActions={copilot.recentActions}
            />
          </SegmentErrorBoundary>
        )}

        {!isMember && (
          <div
            role="status"
            className="flex flex-col gap-2 rounded-2xl border border-brand/15 bg-brand/[0.04] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium text-fg-primary">You are viewing this project as a visitor</p>
              <p className="mt-0.5 text-caption text-fg-muted">
                {isCommunityMember
                  ? "Join the project to collaborate on tasks, files, discussions, and goals."
                  : `Join ${community.name} first, then return to become a project member.`}
              </p>
            </div>
            <Link
              href={isCommunityMember ? "#project-membership" : `/community/${community.slug}`}
              onClick={isCommunityMember ? handleJoin : undefined}
              className="shrink-0 text-xs font-semibold text-brand hover:underline focus-ring"
            >
              {isCommunityMember ? "Join project" : `Open ${community.name}`} →
            </Link>
          </div>
        )}

        <div className="sticky top-[calc(var(--header-height)+0.75rem)] z-20 -mx-1 mt-6 overflow-x-auto rounded-2xl bg-bg-base/85 p-1 backdrop-blur-xl">
          <div className="min-w-max">
            <Tabs
              tabs={[
                { id: "overview", label: "Overview" },
                { id: "activity", label: "Activity", count: workspace.activity.length },
                { id: "tasks", label: "Tasks", count: workspace.tasks.length },
                { id: "members", label: "Members", count: memberCount },
                { id: "files", label: "Files", count: workspace.files.length },
                { id: "discussions", label: "Discussions", count: workspace.discussions.length },
                { id: "goals", label: "Goals", count: workspace.goals.length },
                { id: "analytics", label: "Analytics" },
              ]}
              active={tab}
              onChange={setTab}
            />
          </div>
        </div>

        {tab === "overview" && (
          <ProjectOverviewTab
            data={{ ...data, project: { ...project, progress, status }, workspace }}
            isMember={isMember}
            onNavigate={setTab}
          />
        )}

        {tab === "activity" && (
          <div className="space-y-6">
            <ProjectActivityTab activity={workspace.activity} postsCount={posts.length} />
            <ProjectPostFeed
              posts={posts}
              isMember={isMember}
              isOwner={isOwner}
              currentUserId={currentUser.id}
              isPending={isPending}
              uploadingImage={uploadingImage}
              postBody={postBody}
              postImageUrl={postImageUrl}
              onPostBodyChange={setPostBody}
              onPostImage={handlePostImage}
              onPublish={handlePost}
              onPostUpdate={handlePostUpdate}
              onPostDelete={(postId) => setPosts((prev) => prev.filter((p) => p.id !== postId))}
            />
          </div>
        )}

        {tab === "tasks" && (
          <ProjectTasksTab
            projectId={project.id}
            tasks={workspace.tasks}
            isMember={isMember}
            currentUserId={currentUser.id}
            currentUserName={currentUser.fullName}
            onActivityCommitted={() => void syncFromServer()}
          />
        )}

        {tab === "members" && (
          <ProjectMembersTab
            projectId={project.id}
            members={members}
            communityMembers={data.communityMembers}
            currentUserId={currentUser.id}
            isOwner={isOwner}
            isAdmin={isAdmin}
          />
        )}

        {tab === "files" && (
          <ProjectFilesTab
            projectId={project.id}
            files={workspace.files}
            isMember={isMember}
          />
        )}

        {tab === "discussions" && (
          <ProjectDiscussionsTab
            projectId={project.id}
            discussions={workspace.discussions}
            isMember={isMember}
            currentUserId={currentUser.id}
            currentUserName={currentUser.fullName}
            onActivityCommitted={() => void syncFromServer()}
          />
        )}

        {tab === "goals" && (
          <ProjectGoalsTab
            projectId={project.id}
            goals={workspace.goals}
            isMember={isMember}
          />
        )}

        {tab === "analytics" && <ProjectAnalyticsTab analytics={workspace.analytics} />}
      </FeatureScreen>

      <Modal
        open={fundOpen}
        onClose={() => setFundOpen(false)}
        title="Enable project funding"
        description="Set a funding goal and accept contributions via Stripe."
      >
        <form action={handleEnableFunding} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="detail-funding-goal">Funding goal (USD)</Label>
            <Input
              id="detail-funding-goal"
              name="goal"
              type="number"
              min="5"
              step="1"
              required
              placeholder="1000"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setFundOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" isLoading={isPending}>
              Enable
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit project"
        description="Update name, description, and deadline."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-project-name">Name</Label>
            <Input
              id="edit-project-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-project-description">Description</Label>
            <Textarea
              id="edit-project-description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-project-deadline">Deadline</Label>
            <Input
              id="edit-project-deadline"
              type="date"
              value={editDeadline}
              onChange={(e) => setEditDeadline(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="brand" isLoading={isPending} onClick={handleSaveProjectEdit}>
              Save changes
            </Button>
          </div>
        </div>
      </Modal>

      <FundProjectModal
        open={backOpen}
        onClose={() => setBackOpen(false)}
        project={project}
      />
    </>
  );
}
