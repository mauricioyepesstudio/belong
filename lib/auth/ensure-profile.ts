import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Supabase = SupabaseClient<Database>;

export function isPasswordRecoveryPath(path: string | null | undefined): boolean {
  if (!path) return false;
  return path.includes("recovery=1") || path.includes("type=recovery");
}

export async function ensureUserProfile(
  supabase: Supabase,
  user: User
): Promise<{ onboarding_completed: boolean } | null> {
  const { data: existing } = await supabase
    .from("users")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return existing;

  const meta = user.user_metadata ?? {};
  const { error } = await supabase.from("users").insert({
    id: user.id,
    email: user.email ?? "",
    full_name: (meta.full_name as string) ?? (meta.name as string) ?? null,
    avatar_url: (meta.avatar_url as string) ?? (meta.picture as string) ?? null,
  });

  if (error) {
    console.error("ensureUserProfile:", error.message);
    return null;
  }

  return { onboarding_completed: false };
}
