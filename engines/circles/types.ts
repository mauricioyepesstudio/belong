import type {
  AccountabilityCircleMemberRole,
  AccountabilityCircleMemberStatus,
  Database,
} from "@/types/database.types";

export type { AccountabilityCircleMemberRole, AccountabilityCircleMemberStatus };

export type AccountabilityCircleRow =
  Database["public"]["Tables"]["accountability_circles"]["Row"];
export type AccountabilityCircleMemberRow =
  Database["public"]["Tables"]["accountability_circle_members"]["Row"];

/** Maximum total members (creator + invitees) a circle may ever have. */
export const CIRCLE_MAX_MEMBERS = 6;

export type CircleMemberProfile = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  role: string | null;
};

export type CircleMember = {
  id: string;
  circleId: string;
  role: AccountabilityCircleMemberRole;
  status: AccountabilityCircleMemberStatus;
  joinedAt: string | null;
  createdAt: string;
  user: CircleMemberProfile;
};

export type AccountabilityCircle = {
  id: string;
  name: string;
  goalDescription: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  members: CircleMember[];
  /** Count of members with status in ('invited', 'active') -- what counts toward the cap. */
  memberCount: number;
};
