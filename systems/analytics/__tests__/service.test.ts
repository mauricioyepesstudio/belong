import { describe, expect, it, vi } from "vitest";
import { configureAnalytics } from "@/systems/analytics/service";
import { trackEvent } from "@/systems/analytics/service";
import type { AnalyticsProvider } from "@/systems/analytics/provider";
import { AnalyticsScreen } from "@/systems/analytics/screens";
import { AnalyticsSource } from "@/systems/analytics/sources";

describe("trackEvent", () => {
  it("builds a canonical event payload for providers", async () => {
    const track = vi.fn();
    configureAnalytics({ track } satisfies AnalyticsProvider);

    await trackEvent({
      name: "community_joined",
      userId: "user-1",
      screen: AnalyticsScreen.COMMUNITY,
      source: AnalyticsSource.COMMUNITY_JOIN,
      entityId: "community-1",
      properties: { slug: "builders" },
    });

    expect(track).toHaveBeenCalledOnce();
    const event = track.mock.calls[0][0];
    expect(event.name).toBe("community_joined");
    expect(event.userId).toBe("user-1");
    expect(event.screen).toBe("community");
    expect(event.source).toBe("community.join");
    expect(event.entityId).toBe("community-1");
    expect(event.properties).toEqual({ slug: "builders" });
    expect(typeof event.timestamp).toBe("string");
    expect(Number.isNaN(Date.parse(event.timestamp))).toBe(false);
  });
});
