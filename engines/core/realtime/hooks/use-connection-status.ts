"use client";

import { useEffect, useState } from "react";
import { getConnectionManager } from "../connection-manager";
import type { RealtimeConnectionState } from "../types";

export function useConnectionStatus(): RealtimeConnectionState {
  const [state, setState] = useState<RealtimeConnectionState>("disconnected");

  useEffect(() => {
    return getConnectionManager().onStateChange(setState);
  }, []);

  return state;
}
