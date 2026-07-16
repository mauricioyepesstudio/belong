import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { createMissionEngineService } from "./service";
import type { Mission } from "./types";

export async function getPrimaryMission(): Promise<Mission | null> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const service = createMissionEngineService(supabase);
  return service.getMission({ userId: profile.id });
}

export async function getUserMissions(): Promise<Mission[]> {
  const supabase = await createClient();
  const profile = await requireProfile();
  const service = createMissionEngineService(supabase);

  const { data, error } = await supabase
    .from("missions")
    .select("id")
    .eq("user_id", profile.id)
    .neq("state", "archived")
    .order("is_primary", { ascending: false });

  if (error) throw new Error(error.message);

  const missions = await Promise.all(
    (data ?? []).map((row) => service.getMission({ userId: profile.id }, row.id))
  );

  return missions.filter((m): m is Mission => m !== null);
}
