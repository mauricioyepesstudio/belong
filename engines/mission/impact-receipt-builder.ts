import type { ImpactReceipt } from "@/types/impact-receipt";
import type { Mission } from "@/engines/mission/types";

export function buildMissionReceipt(mission: Mission, userId: string): ImpactReceipt | null {
  if (mission.state !== "completed" || !mission.completedAt) return null;

  return {
    id: `receipt-mission-${mission.id}`,
    subjectType: "Mission",
    subjectId: mission.id,
    title: mission.title,
    summary: mission.description ?? "Mission completed successfully.",
    completedAt: mission.completedAt,
    actorId: userId,
    collaborators: [], // Assuming mission collaborators aren't in Mission type
    metrics: [
      { label: "Milestones completed", value: mission.milestones.filter(m => m.completedAt).length, source: "BELONG" },
      { label: "Total milestones", value: mission.milestones.length, source: "BELONG" }
    ],
    provenance: "Recorded by BELONG"
  };
}
