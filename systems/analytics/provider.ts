import type { AnalyticsEvent } from "./types";

/** Vendor-neutral analytics sink — swap for PostHog, Mixpanel, Amplitude, Segment, etc. */
export interface AnalyticsProvider {
  track(event: AnalyticsEvent): void | Promise<void>;
  identify?(userId: string, traits?: Record<string, unknown>): void | Promise<void>;
}
