import { describe, expect, it, vi } from "vitest";
import {
  AUTH_RATE_LIMITS,
  clientIpFrom,
  consumeAuthRateLimit,
  rateLimitKey,
} from "../rate-limit";

function mockClient(results: Array<{ data: unknown; error: unknown }>) {
  const rpc = vi.fn();
  for (const r of results) rpc.mockResolvedValueOnce(r);
  return { rpc };
}

describe("rateLimitKey", () => {
  it("hashes the value and normalizes case and whitespace", () => {
    const a = rateLimitKey("login", "email", " User@Example.com ");
    const b = rateLimitKey("login", "email", "user@example.com");
    expect(a).toBe(b);
    expect(a).toMatch(/^login:email:[0-9a-f]{64}$/);
    expect(a).not.toContain("example");
  });
});

describe("consumeAuthRateLimit", () => {
  it("allows when every rule is under its limit", async () => {
    const client = mockClient([
      { data: true, error: null },
      { data: true, error: null },
    ]);
    await expect(
      consumeAuthRateLimit(client, "login", { email: "a@b.co", ip: "1.2.3.4" })
    ).resolves.toBe(true);
    expect(client.rpc).toHaveBeenCalledTimes(AUTH_RATE_LIMITS.login.length);
    expect(client.rpc.mock.calls[0][1]).toMatchObject({ p_max: 10, p_window_seconds: 900 });
  });

  it("blocks as soon as one rule is over its limit", async () => {
    const client = mockClient([{ data: false, error: null }]);
    await expect(
      consumeAuthRateLimit(client, "login", { email: "a@b.co", ip: "1.2.3.4" })
    ).resolves.toBe(false);
    expect(client.rpc).toHaveBeenCalledTimes(1);
  });

  it("fails open when the RPC errors (migration not applied)", async () => {
    const client = mockClient([{ data: null, error: { message: "function does not exist" } }]);
    await expect(consumeAuthRateLimit(client, "signup", { ip: "1.2.3.4" })).resolves.toBe(true);
  });

  it("skips rules whose identity is missing", async () => {
    const client = mockClient([]);
    await expect(consumeAuthRateLimit(client, "signup", { ip: null })).resolves.toBe(true);
    expect(client.rpc).not.toHaveBeenCalled();
  });
});

describe("clientIpFrom", () => {
  const h = (values: Record<string, string>) => ({ get: (n: string) => values[n] ?? null });
  it("uses the first x-forwarded-for entry", () => {
    expect(clientIpFrom(h({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" }))).toBe("9.9.9.9");
  });
  it("falls back to x-real-ip", () => {
    expect(clientIpFrom(h({ "x-real-ip": "8.8.8.8" }))).toBe("8.8.8.8");
  });
});
