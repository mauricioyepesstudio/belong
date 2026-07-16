import type { SupabaseServerClient } from "@/lib/core/types";
import type {
  IdentityProfileRecord,
  IdentityRepository,
  UpdateUserProfileRecord,
  UpsertIdentityProfileRecord,
  UserProfileRecord,
} from "../ports/identity-repository";

export class SupabaseIdentityRepository implements IdentityRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async findUserProfile(userId: string): Promise<UserProfileRecord | null> {
    const { data, error } = await this.supabase
      .from("users")
      .select(
        "id, email, full_name, avatar_url, role, location, bio, created_at, updated_at"
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as UserProfileRecord | null;
  }

  async updateUserProfile(
    userId: string,
    patch: UpdateUserProfileRecord
  ): Promise<UserProfileRecord> {
    const { data, error } = await this.supabase
      .from("users")
      .update(patch)
      .eq("id", userId)
      .select(
        "id, email, full_name, avatar_url, role, location, bio, created_at, updated_at"
      )
      .single();

    if (error) throw new Error(error.message);
    return data as UserProfileRecord;
  }

  async findIdentityProfile(userId: string): Promise<IdentityProfileRecord | null> {
    const { data, error } = await this.supabase
      .from("identity_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return this.normalizeIdentityProfile(data);
  }

  async upsertIdentityProfile(
    userId: string,
    patch: UpsertIdentityProfileRecord
  ): Promise<IdentityProfileRecord> {
    const { data, error } = await this.supabase
      .from("identity_profiles")
      .upsert({
        user_id: userId,
        strengths: patch.strengths,
        interests: patch.interests,
        values: patch.values,
        personality: patch.personality,
        experience: patch.experience,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return this.normalizeIdentityProfile(data);
  }

  private normalizeIdentityProfile(row: Record<string, unknown>): IdentityProfileRecord {
    const personality = (row.personality ?? { traits: [] }) as IdentityProfileRecord["personality"];
    const experience = (row.experience ?? []) as IdentityProfileRecord["experience"];

    return {
      user_id: row.user_id as string,
      strengths: (row.strengths as string[]) ?? [],
      interests: (row.interests as string[]) ?? [],
      values: (row.values as string[]) ?? [],
      personality: {
        traits: personality.traits ?? [],
      },
      experience,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };
  }
}
