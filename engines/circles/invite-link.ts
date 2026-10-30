/** Length of a generated circle invite code (matches the DB check: 12-32 chars, a-z0-9). */
export const CIRCLE_INVITE_CODE_LENGTH = 16;

const INVITE_CODE_PATTERN = /^[a-z0-9]{12,32}$/;
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/** A random, URL-safe invite code. Uses Web Crypto, available in Node and the browser. */
export function generateCircleInviteCode(
  randomValues: (bytes: Uint8Array) => Uint8Array = (bytes) => crypto.getRandomValues(bytes)
): string {
  const bytes = randomValues(new Uint8Array(CIRCLE_INVITE_CODE_LENGTH));
  let code = "";
  for (const byte of bytes) code += ALPHABET[byte % ALPHABET.length];
  return code;
}

/** Normalizes a code from a URL and returns null when it cannot be a valid code. */
export function normalizeCircleInviteCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().toLowerCase();
  return INVITE_CODE_PATTERN.test(code) ? code : null;
}

/** App path a person opens to join a circle by link. */
export function circleInvitePath(code: string): string {
  return `/circles/join/${encodeURIComponent(code)}`;
}
