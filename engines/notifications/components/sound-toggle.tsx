"use client";

import { isSoundMuted, PREFERENCES_EVENT, toggleSoundMuted } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { Volume2, VolumeX } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";

type SoundToggleProps = {
  className?: string;
};

function subscribe(callback: () => void) {
  window.addEventListener(PREFERENCES_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(PREFERENCES_EVENT, callback); window.removeEventListener("storage", callback); };
}

function getServerSnapshot() {
  return false;
}

// Small control for the global notification sound preference (persisted in
// localStorage via lib/sound.ts). Uses useSyncExternalStore rather than an
// effect + setState so it stays in sync with lib/sound.ts's mute-changed
// event (e.g. if toggled from another tab/component) without hydration
// mismatches — server snapshot is always "unmuted".
export function SoundToggle({ className }: SoundToggleProps) {
  const muted = useSyncExternalStore(subscribe, isSoundMuted, getServerSnapshot);
  const handleToggle = useCallback(() => {
    toggleSoundMuted();
  }, []);

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-lg text-fg-faint transition-colors hover:bg-bg-hover hover:text-fg-secondary",
        className
      )}
      aria-label={muted ? "Unmute notification sounds" : "Mute notification sounds"}
      aria-pressed={muted}
      title={muted ? "Sound off" : "Sound on"}
    >
      {muted ? <VolumeX className="h-3.5 w-3.5" aria-hidden /> : <Volume2 className="h-3.5 w-3.5" aria-hidden />}
    </button>
  );
}
