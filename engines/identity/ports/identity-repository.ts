export type UserProfileRecord = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  location: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

export type IdentityProfileRecord = {
  user_id: string;
  strengths: string[];
  interests: string[];
  values: string[];
  personality: {
    traits: {
      name: string;
      description?: string | null;
      score?: number | null;
    }[];
  };
  experience: {
    id: string;
    title: string;
    organization: string;
    startYear: number;
    endYear?: number | null;
    description?: string | null;
  }[];
  created_at: string;
  updated_at: string;
};

export type UpdateUserProfileRecord = Partial<
  Pick<UserProfileRecord, "full_name" | "avatar_url" | "role" | "location" | "bio">
>;

export type UpsertIdentityProfileRecord = {
  strengths: string[];
  interests: string[];
  values: string[];
  personality: IdentityProfileRecord["personality"];
  experience: IdentityProfileRecord["experience"];
};

export interface IdentityRepository {
  findUserProfile(userId: string): Promise<UserProfileRecord | null>;
  updateUserProfile(userId: string, patch: UpdateUserProfileRecord): Promise<UserProfileRecord>;
  findIdentityProfile(userId: string): Promise<IdentityProfileRecord | null>;
  upsertIdentityProfile(
    userId: string,
    patch: UpsertIdentityProfileRecord
  ): Promise<IdentityProfileRecord>;
}
