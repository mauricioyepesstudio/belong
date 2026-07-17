"use client";

import { completeDailyMission, joinDailyMission } from "@/lib/actions/mission-engine";
import type { DailyMissionDetailData } from "@/engines/mission/types";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  FeatureScreen,
  ProgressBar,
  useToast,
} from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import {
  ArrowLeft,
  Award,
  Check,
  CheckCircle2,
  Target,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

const statusVariant: Record<string, "brand" | "outline" | "default"> = {
  pending: "outline",
  completed: "brand",
  skipped: "default",
};

export function MissionDetailScreen({ data }: { data: DailyMissionDetailData }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const { mission, participants, objectives, progress, rewards, isOwner, isParticipant } = data;

  const handleComplete = () => {
    startTransition(async () => {
      const result = await completeDailyMission(mission.id);
      if (result.error) toast(result.error, "error");
      else {
        toast("Mission complete", "success");
        router.refresh();
      }
    });
  };

  const handleJoin = () => {
    startTransition(async () => {
      const result = await joinDailyMission(mission.id);
      if (result.error) toast(result.error, "error");
      else {
        toast("Joined mission", "success");
        router.refresh();
      }
    });
  };

  return (
    <FeatureScreen
      label="Mission"
      title={mission.title}
      description={mission.description ?? undefined}
      action={
        <Link href="/dashboard">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to dashboard
          </Button>
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant[mission.status] ?? "outline"} className="capitalize">
                  {mission.status}
                </Badge>
                <span className="text-caption text-fg-muted">
                  {mission.mission_date}
                </span>
              </div>

              {mission.description && (
                <p className="text-body leading-relaxed text-fg-secondary">{mission.description}</p>
              )}

              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-fg-muted">Progress</span>
                  <span className="font-medium tabular-nums">{progress.percent}%</span>
                </div>
                <ProgressBar value={progress.percent} className="mt-2" />
                {progress.milestonesTotal > 0 && (
                  <p className="mt-2 text-caption text-fg-muted">
                    {progress.milestonesCompleted} of {progress.milestonesTotal} life mission
                    milestones complete
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {isOwner && mission.status === "pending" && (
                  <Button variant="brand" disabled={isPending} onClick={handleComplete}>
                    <Check className="h-4 w-4" aria-hidden />
                    Mark complete
                  </Button>
                )}
                {!isParticipant && (
                  <Button variant="brand" disabled={isPending} onClick={handleJoin}>
                    <Users className="h-4 w-4" aria-hidden />
                    Join mission
                  </Button>
                )}
                {isParticipant && !isOwner && (
                  <Badge variant="brand">You joined this mission</Badge>
                )}
                {mission.action_href && mission.action_href !== `/missions/${mission.id}` && (
                  <Link href={mission.action_href}>
                    <Button variant="outline">Go to action</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-brand" aria-hidden />
                <h2 className="text-sm font-semibold text-fg-primary">Objectives</h2>
              </div>

              {objectives.length === 0 ? (
                <EmptyState
                  icon={Target}
                  title="No objectives yet"
                  description="The mission owner has not defined life mission milestones. Objectives appear from their primary mission."
                  className="border-0 bg-transparent py-6"
                />
              ) : (
                <ul className="space-y-3">
                  {objectives.map((objective) => (
                    <li
                      key={objective.id}
                      className="flex items-start gap-3 rounded-xl border border-border-subtle p-4"
                    >
                      {objective.completedAt ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
                      ) : (
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-fg-faint" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-fg-primary">{objective.title}</p>
                        {objective.description && (
                          <p className="mt-1 text-caption">{objective.description}</p>
                        )}
                        {objective.targetDate && (
                          <p className="mt-1 text-micro text-fg-faint">
                            Target {new Date(objective.targetDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-brand" aria-hidden />
                <h2 className="text-sm font-semibold text-fg-primary">Rewards</h2>
              </div>
              <p className="text-3xl font-semibold tabular-nums text-brand">
                +{rewards.impactPoints}
              </p>
              <p className="mt-1 text-caption">Impact points on completion</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-brand" aria-hidden />
                  <h2 className="text-sm font-semibold text-fg-primary">Participants</h2>
                </div>
                <span className="text-caption text-fg-muted">{participants.length}</span>
              </div>

              <ul className="space-y-3">
                {participants.map((participant) => (
                  <li key={participant.id} className="flex items-center gap-3">
                    <Avatar
                      src={participant.avatarUrl ?? undefined}
                      fallback={formatInitials(participant.fullName)}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg-primary">
                        {participant.fullName ?? "Builder"}
                      </p>
                      <p className="text-micro capitalize text-fg-muted">{participant.role}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </FeatureScreen>
  );
}
