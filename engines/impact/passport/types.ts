import type { CollaborationStatus, Database } from "@/types/database.types";

export type { CollaborationStatus };

export type CollaborationRecordRow =
  Database["public"]["Tables"]["collaboration_records"]["Row"];

export type CollaborationParticipant = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  role: string | null;
};

export type CollaborationContext = {
  projectId: string | null;
  projectName: string | null;
  communityId: string | null;
  communityName: string | null;
};

export type CollaborationRecord = {
  id: string;
  status: CollaborationStatus;
  summary: string;
  proposedAt: string;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  proposer: CollaborationParticipant;
  partner: CollaborationParticipant;
  context: CollaborationContext;
};

export type MyCollaborations = {
  pendingSent: CollaborationRecord[];
  pendingReceived: CollaborationRecord[];
  confirmed: CollaborationRecord[];
};
