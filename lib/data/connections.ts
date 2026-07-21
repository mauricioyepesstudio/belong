import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import type { UserProfile } from "@/types/database.types";

export type PendingConnection = {
  id: string;
  requester: Pick<UserProfile, "id" | "full_name" | "avatar_url" | "role">;
  created_at: string;
};

export type DiscoverUser = Pick<
  UserProfile,
  "id" | "full_name" | "avatar_url" | "role" | "build_goal" | "connect_charges_enabled"
>;

export async function getPendingConnections(): Promise<PendingConnection[]> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: requests } = await supabase
    .from("connections")
    .select("id, requester_id, created_at")
    .eq("recipient_id", profile.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (!requests?.length) return [];

  const requesterIds = requests.map((r) => r.requester_id);
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, role")
    .in("id", requesterIds);

  return requests
    .map((r) => {
      const requester = users?.find((u) => u.id === r.requester_id);
      if (!requester) return null;
      return {
        id: r.id,
        requester,
        created_at: r.created_at,
      };
    })
    .filter((r): r is PendingConnection => r !== null);
}

export async function getDiscoverUsers(limit = 24): Promise<DiscoverUser[]> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, role, build_goal, connect_charges_enabled")
    .neq("id", profile.id)
    .eq("onboarding_completed", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export type ConnectedUser = Pick<
  UserProfile,
  "id" | "full_name" | "avatar_url" | "role"
>;

export async function getAcceptedConnections(): Promise<ConnectedUser[]> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data: connections } = await supabase
    .from("connections")
    .select("requester_id, recipient_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${profile.id},recipient_id.eq.${profile.id}`);

  if (!connections?.length) return [];

  const otherIds = connections.map((c) =>
    c.requester_id === profile.id ? c.recipient_id : c.requester_id
  );

  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, role")
    .in("id", otherIds);

  return users ?? [];
}

export async function getAcceptedConnectionIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const profile = await requireProfile();

  const { data } = await supabase
    .from("connections")
    .select("requester_id, recipient_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${profile.id},recipient_id.eq.${profile.id}`);

  const ids = new Set<string>();
  for (const c of data ?? []) {
    ids.add(c.requester_id === profile.id ? c.recipient_id : c.requester_id);
  }
  return ids;
}
