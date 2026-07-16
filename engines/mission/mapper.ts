import { DEFAULT_MISSION_STATE, MISSION_STATES } from "./constants";
import type { MissionMilestoneRecord, MissionRecord } from "./repository";
import { isMissionCategory } from "./utils";
import type {
  CreateMissionInput,
  Mission,
  MissionCategory,
  MissionMilestone,
  MissionState,
  UpdateMissionInput,
} from "./types";

export function toMissionCategory(value: string | null): MissionCategory | null {
  if (!value) return null;
  return isMissionCategory(value) ? value : "custom";
}

export function toMissionDomain(
  record: MissionRecord,
  milestones: MissionMilestoneRecord[] = []
): Mission {
  return {
    id: record.id,
    userId: record.user_id,
    title: record.title,
    description: record.description,
    vision: record.vision,
    category: toMissionCategory(record.category),
    state: record.state,
    isPrimary: record.is_primary,
    milestones: milestones.map(toMilestoneDomain),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    activatedAt: record.activated_at,
    completedAt: record.completed_at,
    archivedAt: record.archived_at,
  };
}

export function toMilestoneDomain(record: MissionMilestoneRecord): MissionMilestone {
  return {
    id: record.id,
    missionId: record.mission_id,
    title: record.title,
    description: record.description,
    targetDate: record.target_date,
    completedAt: record.completed_at,
    sortOrder: record.sort_order,
  };
}

export function toInsertRecord(
  userId: string,
  input: CreateMissionInput
): {
  mission: {
    user_id: string;
    title: string;
    description: string | null;
    vision: string | null;
    category: MissionCategory | null;
    state: MissionState;
    is_primary: boolean;
    activated_at: string | null;
  };
  milestones: {
    mission_id?: string;
    title: string;
    description: string | null;
    target_date: string | null;
    sort_order: number;
  }[];
} {
  const state = input.state ?? (input.isPrimary ? MISSION_STATES.active : DEFAULT_MISSION_STATE);
  const now = new Date().toISOString();

  return {
    mission: {
      user_id: userId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      vision: input.vision?.trim() || null,
      category: input.category ?? null,
      state,
      is_primary: input.isPrimary ?? false,
      activated_at:
        state === MISSION_STATES.active || state === MISSION_STATES.discovering ? now : null,
    },
    milestones: (input.milestones ?? []).map((m) => ({
      title: m.title.trim(),
      description: m.description?.trim() || null,
      target_date: m.targetDate,
      sort_order: m.sortOrder,
    })),
  };
}

export function toUpdatePatch(input: UpdateMissionInput): {
  title?: string;
  description?: string | null;
  vision?: string | null;
  category?: MissionCategory | null;
  state?: MissionState;
  is_primary?: boolean;
  activated_at?: string | null;
  completed_at?: string | null;
  archived_at?: string | null;
} {
  const patch: ReturnType<typeof toUpdatePatch> = {};

  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.description !== undefined) patch.description = input.description?.trim() || null;
  if (input.vision !== undefined) patch.vision = input.vision?.trim() || null;
  if (input.category !== undefined) patch.category = input.category;
  if (input.isPrimary !== undefined) patch.is_primary = input.isPrimary;

  if (input.state !== undefined) {
    patch.state = input.state;
    const now = new Date().toISOString();

    if (input.state === MISSION_STATES.active || input.state === MISSION_STATES.discovering) {
      patch.activated_at = now;
      patch.archived_at = null;
    }
    if (input.state === MISSION_STATES.completed) {
      patch.completed_at = now;
    }
    if (input.state === MISSION_STATES.archived) {
      patch.archived_at = now;
      patch.is_primary = false;
    }
  }

  return patch;
}
