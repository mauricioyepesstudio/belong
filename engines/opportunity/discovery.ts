/**
 * People Discovery data layer.
 *
 * REUSE-ONLY: this module does not introduce a new matching/scoring system.
 * It wraps the existing, deterministic Opportunity Engine (`scorePersonMatch`
 * from ./matchers, backed by SCORE_WEIGHTS in ./scoring) and the existing
 * candidate fetcher (`fetchPeopleCandidates` from ./data) to provide a
 * paginated, filterable people-discovery feed. No new tables, columns, or
 * scoring weights are introduced here.
 *
 * Both `/people/discover` and the home suggestions carousel
 * carousel should call `discoverPeople` (or the `discoverPeopleForHome`
 * convenience wrapper) so recommendation logic is never duplicated.
 */

import type { SupabaseServerClient } from "@/lib/core/types";
import type { UserProfile } from "@/types/database.types";
import {
  resolveConnectionState,
  type ConnectionStateRow,
  type UserConnectionState,
} from "@/lib/core/connection-state";
import { fetchPeopleCandidates } from "./data";
import { scorePersonMatch } from "./matchers";
import { buildCompatibilityProfile, buildOpportunityGraphContext } from "./profile-vector";
import { locationMatches, overlapMatches } from "./scoring";
import type { PersonCandidate } from "./types";
import { getMatchTier } from "@/engines/people/location";

/**
 * Category labels surfaced in the discovery filter chips.
 */
export const DISCOVERY_CATEGORIES = [
  "All",
  "Local to you",
  "Design",
  "Technology",
  "Impact",
  "Business",
  "Community",
  "Education",
] as const;

export type DiscoveryCategory = (typeof DISCOVERY_CATEGORIES)[number];

const CATEGORY_KEYWORDS: Record<Exclude<DiscoveryCategory, "All" | "Local to you">, string[]> = {
  "Design": [
    "design", "diseño", "diseno", "ux", "ui", "product design",
    "graphic", "figma", "branding", "illustration",
  ],
  "Technology": [
    "tech", "tecnologia", "tecnología", "engineering", "developer", "software",
    "code", "coding", "programming", "data", "ai", "machine learning", "product",
  ],
  "Impact": [
    "impact", "impacto", "social", "sustainability", "sustentabilidad",
    "nonprofit", "climate", "clima", "volunteer", "voluntariado", "environment",
  ],
  "Business": [
    "business", "negocios", "startup", "finance", "finanzas", "marketing",
    "sales", "ventas", "entrepreneurship", "emprendimiento", "growth",
  ],
  "Community": [
    "community", "comunidad", "events", "eventos", "organizing", "network",
    "facilitation", "moderación", "moderacion",
  ],
  "Education": [
    "education", "educacion", "educación", "teaching", "enseñanza",
    "mentorship", "mentoria", "mentoría", "learning", "training", "coaching",
  ],
};

export type DiscoveryPerson = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  role: string | null;
  location: string | null;
  nearYou: boolean;
  tags: string[];
  affinityScore: number;
  matchReasons: string[];
  connectionState: UserConnectionState;
  profileSearchHref: string;
};

export type DiscoverPeopleOptions = {
  category?: DiscoveryCategory | null;
  limit?: number;
  offset?: number;
};

export type DiscoverPeopleResult = {
  people: DiscoveryPerson[];
  limit: number;
  offset: number;
  hasMore: boolean;
};

const DEFAULT_PAGE_SIZE = 24;
const DEFAULT_HOME_LIMIT = 8;
const HOME_FALLBACK_TARGET = 5;
const HOME_OVER_FETCH_MULTIPLIER = 3;

function candidateHaystack(candidate: PersonCandidate, communityTags: string[]): string {
  return [
    ...candidate.skills,
    ...candidate.interests,
    ...communityTags,
    candidate.role ?? "",
    candidate.bio ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

function candidateMatchesCategory(
  candidate: PersonCandidate,
  communityTags: string[],
  category: DiscoveryCategory | null | undefined
): boolean {
  if (!category || category === "All" || category === "Local to you") return true;
  const keywords = CATEGORY_KEYWORDS[category as Exclude<DiscoveryCategory, "All" | "Local to you">];
  if (!keywords) return true;
  const haystack = candidateHaystack(candidate, communityTags);
  return keywords.some((keyword) => haystack.includes(keyword));
}

async function resolveCommunityTagsByCandidate(
  supabase: SupabaseServerClient,
  candidates: PersonCandidate[]
): Promise<Map<string, string[]>> {
  const communityIds = [...new Set(candidates.flatMap((c) => c.communityIds))];
  const result = new Map<string, string[]>();
  if (communityIds.length === 0) return result;

  const { data: communityRows } = await supabase
    .from("communities")
    .select("id, tag")
    .in("id", communityIds);

  const tagByCommunity = new Map<string, string>();
  for (const row of communityRows ?? []) {
    if (row.tag) tagByCommunity.set(row.id, row.tag);
  }

  for (const candidate of candidates) {
    const tags = candidate.communityIds
      .map((id) => tagByCommunity.get(id))
      .filter((tag): tag is string => Boolean(tag));
    result.set(candidate.id, tags);
  }

  return result;
}

async function resolveConnectionStatesByCandidate(
  supabase: SupabaseServerClient,
  viewerId: string
): Promise<Map<string, ConnectionStateRow[]>> {
  const { data: rows } = await supabase
    .from("connections")
    .select("id, requester_id, recipient_id, status")
    .or(`requester_id.eq.${viewerId},recipient_id.eq.${viewerId}`);

  const byOtherUser = new Map<string, ConnectionStateRow[]>();
  for (const row of rows ?? []) {
    const otherId = row.requester_id === viewerId ? row.recipient_id : row.requester_id;
    const list = byOtherUser.get(otherId) ?? [];
    list.push(row);
    byOtherUser.set(otherId, list);
  }
  return byOtherUser;
}

export async function discoverPeople(
  supabase: SupabaseServerClient,
  viewerProfile: UserProfile,
  options: DiscoverPeopleOptions = {}
): Promise<DiscoverPeopleResult> {
  const limit = options.limit && options.limit > 0 ? options.limit : DEFAULT_PAGE_SIZE;
  const offset = options.offset && options.offset > 0 ? options.offset : 0;
  const category = options.category ?? "All";

  const compatibilityProfile = await buildCompatibilityProfile(supabase, viewerProfile);

  const [rawPage, context] = await Promise.all([
    fetchPeopleCandidates(supabase, viewerProfile.id, {
      limit: limit + 1,
      offset,
      includeExistingRelationships: true,
    }),
    buildOpportunityGraphContext(supabase, compatibilityProfile),
  ]);

  const hasMore = rawPage.length > limit;
  const pageCandidates = hasMore ? rawPage.slice(0, limit) : rawPage;

  if (pageCandidates.length === 0) {
    return { people: [], limit, offset, hasMore: false };
  }

  const [communityTagsByCandidate, connectionStatesByCandidate] = await Promise.all([
    category === "All" ? Promise.resolve(new Map<string, string[]>()) : resolveCommunityTagsByCandidate(supabase, pageCandidates),
    resolveConnectionStatesByCandidate(supabase, viewerProfile.id),
  ]);

  const eligibleCandidates = pageCandidates.filter((candidate) => {
    const matchesCategory = candidateMatchesCategory(candidate, communityTagsByCandidate.get(candidate.id) ?? [], category);
    if (category === "Local to you") {
      return matchesCategory && getMatchTier(viewerProfile.location, candidate.location) !== "NONE";
    }
    return matchesCategory;
  });

  const scoredPeople = eligibleCandidates
    .map((candidate) => {
      const recommendation = scorePersonMatch(compatibilityProfile, candidate, context);
      if (!recommendation) return null;

      const locationMatch = getMatchTier(viewerProfile.location, candidate.location);
      const affinityScore = recommendation.score + (locationMatch === "SAME_CITY" ? 5 : locationMatch === "SAME_STATE" ? 2 : 0);

      const tags = [...new Set([...candidate.skills, ...candidate.interests])].slice(0, 3);
      const connectionRows = connectionStatesByCandidate.get(candidate.id) ?? [];

      const person: DiscoveryPerson = {
        id: candidate.id,
        fullName: candidate.fullName ?? "Builder",
        avatarUrl: candidate.avatarUrl,
        role: candidate.role,
        location: candidate.location,
        nearYou: locationMatches(viewerProfile.location, candidate.location),
        tags,
        affinityScore: Math.min(100, affinityScore),
        matchReasons: [
          ...recommendation.reasons,
          locationMatch === "SAME_CITY" ? "Same city" : locationMatch === "SAME_STATE" ? "Same state" : ""
        ].filter(Boolean),
        connectionState: resolveConnectionState(viewerProfile.id, connectionRows),
        profileSearchHref: recommendation.href,
      };
      return person;
    })
    .filter((person): person is DiscoveryPerson => person !== null)
    .sort((a, b) => b.affinityScore - a.affinityScore);

  const scoredIds = new Set(scoredPeople.map((person) => person.id));
  const fallbackPeople = eligibleCandidates
    .filter((candidate) => !scoredIds.has(candidate.id))
    .map((candidate) => {
      const recommendation = scorePersonMatch(compatibilityProfile, candidate, context, {
        minimumScore: 0,
        requireExplanation: false,
      });
      return recommendation
        ? toDiscoveryPerson(
            candidate,
            recommendation,
            viewerProfile,
            connectionStatesByCandidate.get(candidate.id) ?? []
          )
        : null;
    })
    .filter((person): person is DiscoveryPerson => person !== null);

  const people = [...scoredPeople, ...fallbackPeople];

  return { people, limit, offset, hasMore };
}

export async function discoverPeopleForHome(
  supabase: SupabaseServerClient,
  viewerProfile: UserProfile,
  limit: number = DEFAULT_HOME_LIMIT
): Promise<DiscoveryPerson[]> {
  const targetLimit = Math.min(Math.max(1, limit), HOME_FALLBACK_TARGET);
  const candidateLimit = Math.max(targetLimit * HOME_OVER_FETCH_MULTIPLIER, DEFAULT_PAGE_SIZE);
  const compatibilityProfile = await buildCompatibilityProfile(supabase, viewerProfile);
  const [candidates, context, connectionStatesByCandidate] = await Promise.all([
    fetchPeopleCandidates(supabase, viewerProfile.id, {
      limit: candidateLimit,
      offset: 0,
      includeExistingRelationships: true,
    }),
    buildOpportunityGraphContext(supabase, compatibilityProfile),
    resolveConnectionStatesByCandidate(supabase, viewerProfile.id),
  ]);

  const strongMatches = candidates
    .map((candidate) => {
      const recommendation = scorePersonMatch(compatibilityProfile, candidate, context);
      if (!recommendation) return null;
      return {
        candidate,
        person: toHomeDiscoveryPerson(
          candidate,
          recommendation,
          viewerProfile,
          connectionStatesByCandidate.get(candidate.id) ?? []
        ),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.person.affinityScore - a.person.affinityScore);

  if (strongMatches.length >= targetLimit) {
    return strongMatches.slice(0, targetLimit).map((item) => item.person);
  }

  const strongIds = new Set(strongMatches.map((item) => item.candidate.id));
  const fallbackMatches = candidates
    .filter((candidate) => !strongIds.has(candidate.id))
    .map((candidate) => {
      const recommendation = scorePersonMatch(compatibilityProfile, candidate, context, {
        minimumScore: 0,
        requireExplanation: false,
      });
      if (!recommendation) return null;

      const sharedCommunityCount = candidate.communityIds.filter((id) =>
        compatibilityProfile.communityIds.includes(id)
      ).length;
      const sharedProfileSignalCount =
        overlapMatches(compatibilityProfile.skills, candidate.skills).length +
        overlapMatches(compatibilityProfile.interests, candidate.interests).length;

      return {
        candidate,
        person: toHomeDiscoveryPerson(
          candidate,
          recommendation,
          viewerProfile,
          connectionStatesByCandidate.get(candidate.id) ?? []
        ),
        sharedCommunityCount,
        sharedProfileSignalCount,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) =>
      b.person.affinityScore - a.person.affinityScore ||
      b.sharedCommunityCount - a.sharedCommunityCount ||
      b.sharedProfileSignalCount - a.sharedProfileSignalCount ||
      a.candidate.id.localeCompare(b.candidate.id)
    );

  return [
    ...strongMatches.map((item) => item.person),
    ...fallbackMatches.map((item) => item.person),
  ].slice(0, targetLimit);
}

function toHomeDiscoveryPerson(
  candidate: PersonCandidate,
  recommendation: NonNullable<ReturnType<typeof scorePersonMatch>>,
  viewerProfile: UserProfile,
  connectionRows: ConnectionStateRow[]
): DiscoveryPerson {
  return toDiscoveryPerson(candidate, recommendation, viewerProfile, connectionRows);
}

function toDiscoveryPerson(
  candidate: PersonCandidate,
  recommendation: NonNullable<ReturnType<typeof scorePersonMatch>>,
  viewer: Pick<UserProfile, "id" | "location">,
  connectionRows: ConnectionStateRow[] = []
): DiscoveryPerson {
  const locationMatch = getMatchTier(viewer.location, candidate.location);
  return {
    id: candidate.id,
    fullName: candidate.fullName ?? "Builder",
    avatarUrl: candidate.avatarUrl,
    role: candidate.role,
    location: candidate.location,
    nearYou: locationMatches(viewer.location, candidate.location),
    tags: [...new Set([...candidate.skills, ...candidate.interests])].slice(0, 3),
    affinityScore: Math.min(100, recommendation.score + (locationMatch === "SAME_CITY" ? 5 : locationMatch === "SAME_STATE" ? 2 : 0)),
    matchReasons: [
        ...recommendation.reasons,
        locationMatch === "SAME_CITY" ? "Same city" : locationMatch === "SAME_STATE" ? "Same state" : ""
    ].filter(Boolean),
    connectionState: resolveConnectionState(viewer.id, connectionRows),
    profileSearchHref: recommendation.href,
  };
}
