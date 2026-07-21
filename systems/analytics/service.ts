import { consoleAnalyticsProvider } from "./providers/console";
import { noopAnalyticsProvider } from "./providers/noop";
import type { AnalyticsProvider } from "./provider";
import type { AnalyticsEvent, TrackEventInput } from "./types";

let provider: AnalyticsProvider =
  process.env.NODE_ENV === "development" ? consoleAnalyticsProvider : noopAnalyticsProvider;

/** Replace the active provider (e.g. PostHog, Segment) at app bootstrap. */
export function configureAnalytics(next: AnalyticsProvider): void {
  provider = next;
}

export function getAnalyticsProvider(): AnalyticsProvider {
  return provider;
}

/** Central analytics entry point — all product events flow through here. */
export async function trackEvent(input: TrackEventInput): Promise<void> {
  const event: AnalyticsEvent = {
    name: input.name,
    userId: input.userId,
    timestamp: new Date().toISOString(),
    screen: input.screen,
    source: input.source,
    entityId: input.entityId,
    properties: input.properties,
  };

  await provider.track(event);
}
