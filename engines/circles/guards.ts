import type { AccountabilityCircleMemberStatus } from "./types";
import { CIRCLE_MAX_MEMBERS } from "./types";

export type CircleGuardRecord = {
  creatorId: string;
};

export type ActingMembershipGuardRecord = {
  userId: string;
  /** null when the acting user has no membership row yet (e.g. the creator, pre-bootstrap). */
  status: AccountabilityCircleMemberStatus | null;
};

export type MembershipGuardRecord = {
  userId: string;
  status: AccountabilityCircleMemberStatus;
};

/**
 * Only an already-active member, or the circle's creator (even before their
 * own bootstrap membership row exists), may invite a new member. Mirrors
 * the accountability_circle_members insert RLS policy exactly.
 */
export function canInvite(
  circle: CircleGuardRecord,
  actingMembership: ActingMembershipGuardRecord
): boolean {
  return actingMembership.userId === circle.creatorId || actingMembership.status === "active";
}

/** A user may only accept their own still-invited membership row. */
export function canAccept(membership: MembershipGuardRecord, userId: string): boolean {
  return membership.userId === userId && membership.status === "invited";
}

/**
 * A member may remove themselves (leaving or declining), regardless of
 * status; the circle's creator may remove anyone. Mirrors the
 * accountability_circle_members delete RLS policy exactly.
 */
export function canRemove(
  circle: CircleGuardRecord,
  actingUserId: string,
  targetUserId: string
): boolean {
  return actingUserId === targetUserId || actingUserId === circle.creatorId;
}

/** Circles are capped at CIRCLE_MAX_MEMBERS total (active + invited). */
export function isAtCapacity(activeAndInvitedCount: number): boolean {
  return activeAndInvitedCount >= CIRCLE_MAX_MEMBERS;
}
