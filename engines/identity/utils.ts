export function createExperienceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `exp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeCollection(values: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(value);
  }

  return normalized;
}
