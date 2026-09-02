import type { SupabaseServerClient } from "@/lib/core/types";
import type {
  CollaborationParticipant,
  CollaborationRecord,
  CollaborationRecordRow,
  MyCollaborations,
} from "./types";

type ParticipantRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

function toParticipant(
  row: ParticipantRow | undefined,
  fallbackId: string
): CollaborationParticipant {
  return {
    id: fallbackId,
    fullName: row?.full_name ?? "Builder",
    avatarUrl: row?.avatar_url ?? null,
    role: row?.role ?? null,
  };
}

function toCollaborationRecord(
  row: CollaborationRecordRow,
  userMap: Map<string, ParticipantRow>,
  projectMap: Map<string, { id: string; name: string }>,
  communityMap: Map<string, { id: string; name: string; slug: string }>
): CollaborationRecord {
  return {
    id: row.id,
    status: row.status,
    summary: row.summary,
    proposedAt: row.proposed_at,
    respondedAt: row.responded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    proposer: toParticipant(userMap.get(row.proposer_id), row.proposer_id),
    partner: toParticipant(userMap.get(row.partner_id), row.partner_id),
    context: {
      projectId: row.project_id,
      projectName: row.project_id ? projectMap.get(row.project_id)?.name ?? null : null,
      communityId: row.community_id,
      communityName: row.community_id ? communityMap.get(row.community_id)?.name ?? null : null,
    },
  };
}

/**
 * Reads every collaboration record a user is party to (as proposer or
 * partner) and buckets it by state. This is an RSC-safe read: it never
 * mutates and relies on RLS to already scope rows to the caller.
 */
export async function listMyCollaborations(
  supabase: SupabaseServerClient,
  userId: string
): Promise<MyCollaborations> {
  const { data, error } = await supabase
    .from("collaboration_records")
    .select("*")
    .or(`proposer_id.eq.${userId},partner_id.eq.${userId}`)
    .order("proposed_at", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw error;

  const rows = data ?? [];
  if (rows.length === 0) {
    return { pendingSent: [], pendingReceived: [], confirmed: [] };
  }

  const participantIds = [
    ...new Set(rows.flatMap((row) => [row.proposer_id, row.partner_id])),
  ];
  const projectIds = [
    ...new Set(rows.flatMap((row) => (row.project_id ? [row.project_id] : []))),
  ];
  const communityIds = [
    ...new Set(rows.flatMap((row) => (row.community_id ? [row.community_id] : []))),
  ];

  const [{ data: users }, projects, communities] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, avatar_url, role")
      .in("id", participantIds),
    projectIds.length
      ? supabase.from("projects").select("id, name").in("id", projectIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    communityIds.length
      ? supabase.from("communities").select("id, name, slug").in("id", communityIds)
      : Promise.resolve({ data: [] as { id: string; name: string; slug: string }[] }),
  ]);

  const userMap = new Map((users ?? []).map((user) => [user.id, user]));
  const projectMap = new Map((projects.data ?? []).map((project) => [project.id, project]));
  const communityMap = new Map(
    (communities.data ?? []).map((community) => [community.id, community])
  );

  const records = rows.map((row) =>
    toCollaborationRecord(row, userMap, projectMap, communityMap)
  );

  return {
    pendingSent: records.filter((r) => r.status === "pending" && r.proposer.id === userId),
    pendingReceived: records.filter((r) => r.status === "pending" && r.partner.id === userId),
    confirmed: records.filter((r) => r.status === "confirmed"),
  };
}
