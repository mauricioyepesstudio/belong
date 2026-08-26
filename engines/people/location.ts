export type LocationMatch = "NONE" | "SAME_STATE" | "SAME_CITY";

export interface NearbyAlignmentEligibility {
  candidateId: string;
  locationMatch: LocationMatch;
  affinity: number;
  reasons: string[];
  notificationEligible: boolean;
}

export function normalizeLocation(location: string | null): { city: string | null; state: string | null } {
  if (!location) return { city: null, state: null };
  const parts = location.split(",");
  if (parts.length < 2) return { city: location.trim(), state: null };
  return {
    city: parts[0].trim(),
    state: parts[1].trim().toUpperCase(),
  };
}

export function getMatchTier(
  viewerLoc: string | null,
  candidateLoc: string | null
): LocationMatch {
  if (!viewerLoc || !candidateLoc) return "NONE";
  const v = normalizeLocation(viewerLoc);
  const c = normalizeLocation(candidateLoc);
  if (!v.city || !c.city) return "NONE";
  if (v.city === c.city && v.state === c.state) return "SAME_CITY";
  if (v.state && c.state && v.state === c.state) return "SAME_STATE";
  return "NONE";
}
