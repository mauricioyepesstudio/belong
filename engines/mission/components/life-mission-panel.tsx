"use client";

import { saveLifeMission } from "@/lib/actions/life-mission";
import type { Mission, MissionProgress } from "@/engines/mission/types";
import { getBuildGoalOption } from "@/engines/mission/config";
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Label,
  Modal,
  ProgressBar,
  Textarea,
  useToast,
} from "@/systems/design-system";
import { cn } from "@/lib/utils";
import { Pencil, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { UserProfile } from "@/types/database.types";

type LifeMissionPanelProps = {
  profile: UserProfile;
  lifeMission: Mission | null;
  progress: MissionProgress | null;
  compact?: boolean;
};

export function LifeMissionPanel({
  profile,
  lifeMission,
  progress,
  compact,
}: LifeMissionPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const buildGoal = getBuildGoalOption(profile.build_goal);
  const BuildIcon = buildGoal?.icon ?? Sparkles;

  const [title, setTitle] = useState(lifeMission?.title ?? "");
  const [description, setDescription] = useState(lifeMission?.description ?? "");
  const [vision, setVision] = useState(
    lifeMission?.vision ?? profile.build_vision ?? ""
  );

  const openEditor = () => {
    setTitle(lifeMission?.title ?? (buildGoal ? `Build: ${buildGoal.label}` : ""));
    setDescription(lifeMission?.description ?? "");
    setVision(lifeMission?.vision ?? profile.build_vision ?? "");
    setEditOpen(true);
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveLifeMission({ title, description, vision });
      if (result.error) toast(result.error, "error");
      else {
        toast(lifeMission ? "Life mission updated" : "Life mission created", "success");
        setEditOpen(false);
        router.refresh();
      }
    });
  };

  if (!lifeMission) {
    return (
      <>
        <EmptyState
          icon={Sparkles}
          title="Define your life mission"
          description="Your mission is the north star for daily actions, weekly goals, and quarterly outcomes on BELONG."
          action={{ label: "Create life mission", onClick: openEditor }}
          className="border-none bg-transparent py-4"
        />
        <MissionEditorModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title={title}
          description={description}
          vision={vision}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onVisionChange={setVision}
          onSave={handleSave}
          isPending={isPending}
          isNew
        />
      </>
    );
  }

  const completion = progress?.completionPercent ?? 0;

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" className="capitalize">
                {lifeMission.state}
              </Badge>
              {buildGoal && (
                <Badge variant="outline">{buildGoal.label}</Badge>
              )}
            </div>
            <h3 className="mt-2 text-lg font-semibold text-fg-primary">{lifeMission.title}</h3>
            {lifeMission.description && (
              <p
                className={cn(
                  "mt-1 text-fg-secondary",
                  compact ? "line-clamp-3 text-sm" : "text-sm"
                )}
              >
                {lifeMission.description}
              </p>
            )}
            {lifeMission.vision && (
              <p className="mt-2 text-caption italic text-fg-muted line-clamp-3">
                {lifeMission.vision}
              </p>
            )}
          </div>
          <Button size="sm" variant="secondary" onClick={openEditor} className="shrink-0">
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Edit
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-fg-muted">
            <span>Mission progress</span>
            <span>{completion}%</span>
          </div>
          <ProgressBar value={completion} className="h-2" animate={false} />
          {progress && (
            <p className="text-micro text-fg-faint">
              {progress.dailyMissionsCompleted} daily missions · {progress.weeklyGoalsCompleted}{" "}
              weekly goals · {progress.currentStreak} day streak
            </p>
          )}
        </div>

        {buildGoal && (
          <div
            className={cn(
              "rounded-2xl border border-border-subtle bg-gradient-to-br p-4",
              buildGoal.gradient
            )}
          >
            <div className="flex items-center gap-3">
              <BuildIcon className="h-5 w-5 text-brand" aria-hidden />
              <div>
                <p className="text-xs text-fg-muted">Building toward</p>
                <p className="text-sm font-semibold text-fg-primary">{buildGoal.label}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <MissionEditorModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={title}
        description={description}
        vision={vision}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onVisionChange={setVision}
        onSave={handleSave}
        isPending={isPending}
        isNew={false}
      />
    </>
  );
}

function MissionEditorModal({
  open,
  onClose,
  title,
  description,
  vision,
  onTitleChange,
  onDescriptionChange,
  onVisionChange,
  onSave,
  isPending,
  isNew,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  vision: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onVisionChange: (v: string) => void;
  onSave: () => void;
  isPending: boolean;
  isNew: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? "Create life mission" : "Edit life mission"}
      description="One mission that guides your execution on BELONG."
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="life-mission-title">Title</Label>
          <Input
            id="life-mission-title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="What are you building with your life?"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="life-mission-description">Description</Label>
          <Textarea
            id="life-mission-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Why does this matter?"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="life-mission-vision">Vision</Label>
          <Textarea
            id="life-mission-vision"
            value={vision}
            onChange={(e) => onVisionChange(e.target.value)}
            placeholder="What does success look like?"
            rows={3}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="brand"
            disabled={isPending || !title.trim()}
            onClick={onSave}
            isLoading={isPending}
          >
            Save mission
          </Button>
        </div>
      </div>
    </Modal>
  );
}
