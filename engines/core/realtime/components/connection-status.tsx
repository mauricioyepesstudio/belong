"use client";

import { useConnectionStatus } from "../hooks/use-connection-status";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";

const stateConfig = {
  connected: {
    label: "Live",
    className: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    icon: Wifi,
  },
  connecting: {
    label: "Connecting",
    className: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    icon: Wifi,
  },
  reconnecting: {
    label: "Reconnecting",
    className: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    icon: Wifi,
  },
  disconnected: {
    label: "Offline",
    className: "text-fg-muted border-border-subtle bg-white/[0.03]",
    icon: WifiOff,
  },
} as const;

export function ConnectionStatus({ className }: { className?: string }) {
  const state = useConnectionStatus();
  const config = stateConfig[state];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-micro font-medium",
        config.className,
        className
      )}
      title={`Realtime ${config.label.toLowerCase()}`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {config.label}
    </span>
  );
}
