import type { SocialMediaType } from "@/types/database.types";

export const SOCIAL_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const SOCIAL_VIDEO_MAX_BYTES = 50 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export function classifySocialMedia(file: Pick<File, "type" | "size">):
  | { type: SocialMediaType; maxBytes: number }
  | null {
  if (IMAGE_TYPES.has(file.type)) {
    return { type: "image", maxBytes: SOCIAL_IMAGE_MAX_BYTES };
  }
  if (VIDEO_TYPES.has(file.type)) {
    return { type: "video", maxBytes: SOCIAL_VIDEO_MAX_BYTES };
  }
  return null;
}

export function socialMediaExtension(fileName: string, mimeType: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (extension) return extension;
  const fallbacks: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };
  return fallbacks[mimeType] ?? "bin";
}

export function isOwnedSocialMediaPath(path: string, userId: string): boolean {
  if (
    !path ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.includes("//")
  ) {
    return false;
  }
  const segments = path.split("/");
  return (
    segments.length === 2 &&
    segments[0] === userId &&
    segments[1].length > 0 &&
    segments.every((segment) => segment !== "." && segment !== "..")
  );
}

export function socialMediaPathFromPublicUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const marker = "/storage/v1/object/public/post-media/";
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex < 0) return null;
    return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}
