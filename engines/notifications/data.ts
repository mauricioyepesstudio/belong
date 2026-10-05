import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

export async function getNotifications() {
  const supabase = await createClient();
  const user = await getSession();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
}

export async function getUnreadNotificationCount() {
  const supabase = await createClient();
  const user = await getSession();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  return count ?? 0;
}
