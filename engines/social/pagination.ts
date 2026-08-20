import type { GlobalSocialFeedCursor, SocialFeedCursor } from "./types";

export function encodeSocialFeedCursor(cursor: SocialFeedCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function encodeGlobalSocialFeedCursor(
  cursor: GlobalSocialFeedCursor
): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeGlobalSocialFeedCursor(
  value?: string | null
): GlobalSocialFeedCursor | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    ) as Partial<GlobalSocialFeedCursor>;
    const validBoundary =
      (parsed.beforeCreatedAt === null && parsed.beforeId === null) ||
      (typeof parsed.beforeCreatedAt === "string" &&
        !Number.isNaN(Date.parse(parsed.beforeCreatedAt)) &&
        typeof parsed.beforeId === "string" &&
        parsed.beforeId.length > 0);
    if (
      !validBoundary ||
      typeof parsed.offset !== "number" ||
      !Number.isInteger(parsed.offset) ||
      parsed.offset < 0
    ) {
      return null;
    }
    return {
      beforeCreatedAt: parsed.beforeCreatedAt ?? null,
      beforeId: parsed.beforeId ?? null,
      offset: parsed.offset,
    };
  } catch {
    return null;
  }
}

export function decodeSocialFeedCursor(value?: string | null): SocialFeedCursor | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    ) as Partial<SocialFeedCursor>;
    if (
      typeof parsed.createdAt !== "string" ||
      Number.isNaN(Date.parse(parsed.createdAt)) ||
      typeof parsed.id !== "string" ||
      parsed.id.length === 0
    ) {
      return null;
    }
    return { createdAt: parsed.createdAt, id: parsed.id };
  } catch {
    return null;
  }
}
