export type ImpactReceiptMetric = {
  label: string;
  value: number;
  source: string;
};

export interface ImpactReceipt {
  id: string;
  subjectType: "Mission" | "Project" | "Event" | "Community";
  subjectId: string;
  title: string;
  summary: string;
  completedAt: string;
  actorId: string;
  collaborators: { id: string; name: string }[];
  metrics: ImpactReceiptMetric[];
  provenance: "Recorded by BELONG" | "Confirmed by owner";
}
