import type { CollaborationStatus } from "./types";

export type CollaborationGuardRecord = {
  status: CollaborationStatus;
  proposerId: string;
  partnerId: string;
};

/** A user can only ever propose a collaboration record with someone else. */
export function canPropose(proposerId: string, partnerId: string): boolean {
  return Boolean(proposerId) && Boolean(partnerId) && proposerId !== partnerId;
}

/**
 * Only the partner may confirm a still-pending record, and never the
 * proposer -- self-confirmation must be structurally impossible.
 */
export function canConfirm(record: CollaborationGuardRecord, userId: string): boolean {
  return (
    record.status === "pending" &&
    record.partnerId === userId &&
    record.proposerId !== userId
  );
}

/** Only the partner may decline a still-pending record. */
export function canDecline(record: CollaborationGuardRecord, userId: string): boolean {
  return (
    record.status === "pending" &&
    record.partnerId === userId &&
    record.proposerId !== userId
  );
}

/** Only the proposer may withdraw their own still-pending proposal. */
export function canCancel(record: CollaborationGuardRecord, userId: string): boolean {
  return record.status === "pending" && record.proposerId === userId;
}
