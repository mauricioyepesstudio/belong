import type { SupabaseServerClient } from "@/lib/core/types";
import type { MissionCategory, MissionState } from "./types";

/** Internal persistence shape — not exported to UI layers. */
export type MissionRecord = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_primary: boolean;
  state: MissionState;
  vision: string | null;
  category: string | null;
  activated_at: string | null;
  completed_at: string | null;
  archived_at: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
};

export type MissionMilestoneRecord = {
  id: string;
  mission_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
};

export type InsertMissionRecord = {
  user_id: string;
  title: string;
  description?: string | null;
  vision?: string | null;
  category?: MissionCategory | null;
  state: MissionState;
  is_primary: boolean;
  activated_at?: string | null;
  completed_at?: string | null;
  archived_at?: string | null;
  organization_id: string;
};

export type UpdateMissionRecord = Partial<
  Pick<
    MissionRecord,
    | "title"
    | "description"
    | "vision"
    | "category"
    | "state"
    | "is_primary"
    | "activated_at"
    | "completed_at"
    | "archived_at"
  >
>;

export type InsertMilestoneRecord = {
  mission_id: string;
  title: string;
  description?: string | null;
  target_date?: string | null;
  sort_order: number;
};

export class MissionRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  getClient(): SupabaseServerClient {
    return this.supabase;
  }

  async findById(userId: string, missionId: string): Promise<MissionRecord | null> {
    const { data, error } = await this.supabase
      .from("missions")
      .select("*")
      .eq("id", missionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as MissionRecord | null;
  }

  async findPrimary(userId: string): Promise<MissionRecord | null> {
    const { data, error } = await this.supabase
      .from("missions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_primary", true)
      .neq("state", "archived")
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as MissionRecord | null;
  }

  async findAllByUserId(userId: string): Promise<MissionRecord[]> {
    const { data, error } = await this.supabase
      .from("missions")
      .select("*")
      .eq("user_id", userId)
      .order("is_primary", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as MissionRecord[];
  }

  async insert(record: InsertMissionRecord): Promise<MissionRecord> {
    const { data, error } = await this.supabase
      .from("missions")
      .insert(record)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data as MissionRecord;
  }

  async update(
    userId: string,
    missionId: string,
    patch: UpdateMissionRecord
  ): Promise<MissionRecord> {
    const { data, error } = await this.supabase
      .from("missions")
      .update(patch)
      .eq("id", missionId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data as MissionRecord;
  }

  async clearPrimary(userId: string, exceptMissionId?: string): Promise<void> {
    let query = this.supabase
      .from("missions")
      .update({ is_primary: false })
      .eq("user_id", userId)
      .eq("is_primary", true);

    if (exceptMissionId) {
      query = query.neq("id", exceptMissionId);
    }

    const { error } = await query;
    if (error) throw new Error(error.message);
  }

  async findMilestones(missionId: string): Promise<MissionMilestoneRecord[]> {
    const { data, error } = await this.supabase
      .from("mission_milestones")
      .select("*")
      .eq("mission_id", missionId)
      .order("sort_order");

    if (error) throw new Error(error.message);
    return (data ?? []) as MissionMilestoneRecord[];
  }

  async insertMilestones(records: InsertMilestoneRecord[]): Promise<void> {
    if (!records.length) return;

    const { error } = await this.supabase.from("mission_milestones").insert(records);
    if (error) throw new Error(error.message);
  }

  async countCompletedDailyMissions(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("daily_missions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed");

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  async countCompletedWeeklyGoals(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("weekly_goals")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed");

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  async findMomentum(userId: string): Promise<{
    current_streak: number;
    last_active_date: string | null;
  } | null> {
    const { data, error } = await this.supabase
      .from("user_momentum")
      .select("current_streak, last_active_date")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }
}
