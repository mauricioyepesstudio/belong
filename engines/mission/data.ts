import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import type { Mission } from "@/types/database.types";

export async function getPrimaryMission(): Promise<Mission | null> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data } = await supabase
    .from("missions")
    .select("*")
    .eq("user_id", profile.id)
    .eq("is_primary", true)
    .maybeSingle();

  return data;
}

export async function getUserMissions(): Promise<Mission[]> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data } = await supabase
    .from("missions")
    .select("*")
    .eq("user_id", profile.id)
    .order("is_primary", { ascending: false });

  return data ?? [];
}
