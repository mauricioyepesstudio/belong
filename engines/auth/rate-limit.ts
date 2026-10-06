import { createHash } from "node:crypto";

export type RateLimitAction = "login" | "signup" | "password_reset";

type Rule = { scope: "email" | "ip"; max: number; windowSeconds: number };

// Per-action limits. Email rules stop guessing one account; IP rules stop
// one client spraying many accounts.
export const AUTH_RATE_LIMITS: Record<RateLimitAction, Rule[]> = {
  login: [
    { scope: "email", max: 10, windowSeconds: 15 * 60 },
    { scope: "ip", max: 30, windowSeconds: 15 * 60 },
  ],
  signup: [{ scope: "ip", max: 5, windowSeconds: 60 * 60 }],
  password_reset: [
    { scope: "email", max: 5, windowSeconds: 60 * 60 },
    { scope: "ip", max: 10, windowSeconds: 60 * 60 },
  ],
};

export const RATE_LIMIT_MESSAGE = "Too many attempts. Please wait a few minutes and try again.";

export type RpcClient = {
  rpc: (
    fn: "consume_auth_rate_limit",
    args: { p_key: string; p_max: number; p_window_seconds: number }
  ) => PromiseLike<{ data: unknown; error: unknown }>;
};

export function rateLimitKey(action: RateLimitAction, scope: Rule["scope"], value: string): string {
  const digest = createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
  return `${action}:${scope}:${digest}`;
}

/**
 * Records one attempt per applicable rule and returns false once any rule is
 * over its limit. Fails open (returns true) when the RPC errors, e.g. before
 * the 20261006000001 migration is applied, so auth never breaks because of it.
 */
export async function consumeAuthRateLimit(
  client: RpcClient,
  action: RateLimitAction,
  identity: { email?: string | null; ip?: string | null }
): Promise<boolean> {
  for (const rule of AUTH_RATE_LIMITS[action]) {
    const value = rule.scope === "email" ? identity.email : identity.ip;
    if (!value) continue;
    const { data, error } = await client.rpc("consume_auth_rate_limit", {
      p_key: rateLimitKey(action, rule.scope, value),
      p_max: rule.max,
      p_window_seconds: rule.windowSeconds,
    });
    if (error) {
      console.warn("[auth-rate-limit] check skipped:", error);
      return true;
    }
    if (data === false) return false;
  }
  return true;
}

export function clientIpFrom(headers: { get(name: string): string | null }): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return headers.get("x-real-ip");
}
