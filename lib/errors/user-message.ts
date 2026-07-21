const TECHNICAL_PATTERNS = [
  /^PGRST/i,
  /^JWT/i,
  /duplicate key/i,
  /violates .* constraint/i,
  /permission denied/i,
  /new row violates/i,
  /relation .* does not exist/i,
  /column .* does not exist/i,
  /Supabase/i,
  /postgres/i,
  /fetch failed/i,
  /network error/i,
];

/** Returns a safe message for end users; hides technical/database errors. */
export function toUserErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : "";

  const trimmed = message.trim();
  if (!trimmed) return fallback;

  if (trimmed.length > 160 || TECHNICAL_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return fallback;
  }

  return trimmed;
}
