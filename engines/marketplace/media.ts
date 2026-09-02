// 12MB: modern phone camera photos routinely land in the 5-15MB range,
// so 5MB was rejecting normal real-world photos before they ever reached
// the server. The Server Action body limit (next.config.ts) and the
// listing-media storage bucket's file_size_limit (see the migration that
// creates it) both need to stay at or above this value.
export const LISTING_IMAGE_MAX_BYTES = 12 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function isListingImageType(mimeType: string): boolean {
  return IMAGE_TYPES.has(mimeType);
}

export function listingImageExtension(fileName: string, mimeType: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (extension) return extension;
  const fallbacks: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return fallbacks[mimeType] ?? "bin";
}
