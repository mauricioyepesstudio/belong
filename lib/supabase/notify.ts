import type { Json, NotificationType } from "@/types/database.types";
import type { SupabaseServerClient } from "@/lib/core/types";

export async function createNotification(
  supabase: SupabaseServerClient,
  params: {
    userId: string;
    title: string;
    body?: string;
    type?: NotificationType;
    metadata?: Json;
  }
) {
  const { error } = await supabase.rpc("create_notification", {
    p_user_id: params.userId,
    p_title: params.title,
    p_body: params.body ?? "",
    p_type: params.type ?? "system",
    p_metadata: params.metadata ?? {},
  });

  if (error) {
    console.error("create_notification failed:", error.message);
    return { error: error.message };
  }
  return {};
}

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${Date.now().toString(36).slice(-5)}`;
}
