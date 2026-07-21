"use client";

import { usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import { pathnameToScreen } from "./screens";
import { trackClientEvent } from "./track-client";
import type { AnalyticsEventName, AnalyticsProperties } from "./types";

type TrackOptions = {
  name: AnalyticsEventName;
  source: string;
  screen?: string;
  entityId?: string;
  properties?: AnalyticsProperties;
};

export function useAnalytics(userId: string) {
  const pathname = usePathname();
  const screen = pathnameToScreen(pathname);

  const track = useCallback(
    (options: TrackOptions) =>
      trackClientEvent({
        userId,
        screen: options.screen ?? screen,
        ...options,
      }),
    [userId, screen]
  );

  return useMemo(() => ({ track, screen }), [track, screen]);
}
