import type { SupabaseServerClient } from "@/lib/core/types";
import type { UserSkillsRepository } from "../ports/user-skills-repository";

export class SupabaseUserSkillsRepository implements UserSkillsRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async findByUserId(userId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from("user_skills")
      .select("skill")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => row.skill);
  }

  async replaceAll(userId: string, skills: string[]): Promise<string[]> {
    const { error: deleteError } = await this.supabase
      .from("user_skills")
      .delete()
      .eq("user_id", userId);

    if (deleteError) throw new Error(deleteError.message);

    if (skills.length === 0) return [];

    const rows = skills.map((skill) => ({
      user_id: userId,
      skill,
    }));

    const { data, error } = await this.supabase
      .from("user_skills")
      .insert(rows)
      .select("skill");

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => row.skill);
  }
}
