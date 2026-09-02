import type { SupabaseServerClient } from "@/lib/core/types";
import type { AccountabilityCheckinRow } from "@/types/database.types";

export type { AccountabilityCheckinRow };

export type CircleCheckinAuthor = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
};

export type CircleCheckin = {
  id: string;
  circleId: string;
  body: string;
  createdAt: string;
  author: CircleCheckinAuthor;
};

type AuthorProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

function toCircleCheckin(
  row: AccountabilityCheckinRow,
  authorMap: Map<string, AuthorProfileRow>
): CircleCheckin {
  const author = authorMap.get(row.author_id);
  return {
    id: row.id,
    circleId: row.circle_id,
    body: row.body,
    createdAt: row.created_at,
    author: {
      id: row.author_id,
      fullName: author?.full_name ?? "Builder",
      avatarUrl: author?.avatar_url ?? null,
    },
  };
}

/**
 * Reads every check-in posted in a circle, newest first, with author
 * name/avatar joined in. This is an RSC-safe read: it never mutates and
 * relies on RLS to already scope rows to active members of the circle.
 * Day labels (e.g. "Today", "Yesterday") are derived client-side from
 * createdAt -- there is no stored cadence field.
 */
export async function listCircleCheckins(
  supabase: SupabaseServerClient,
  circleId: string
): Promise<CircleCheckin[]> {
  const { data: checkins, error: checkinsError } = await supabase
    .from("accountability_checkins")
    .select("*")
    .eq("circle_id", circleId)
    .order("created_at", { ascending: false });
  if (checkinsError) throw checkinsError;

  const authorIds = [...new Set((checkins ?? []).map((row) => row.author_id))];
  const { data: authors, error: authorsError } = authorIds.length
    ? await supabase.from("users").select("id, full_name, avatar_url").in("id", authorIds)
    : { data: [] as AuthorProfileRow[], error: null };
  if (authorsError) throw authorsError;

  const authorMap = new Map((authors ?? []).map((author) => [author.id, author]));

  return (checkins ?? []).map((row) => toCircleCheckin(row, authorMap));
}
