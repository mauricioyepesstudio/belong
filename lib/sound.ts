"use client";

export type SoundCategory = "messages" | "connections" | "social" | "missions";
export type SoundEvent = "connection-request-sent" | "connection-request-received" | "connection-accepted" | "new-message" | "new-comment" | "new-support" | "new-project-community" | "mission-completed" | "generic-success";
export type NotificationPreferences = {
  soundEnabled: boolean;
  sounds: Record<SoundCategory, boolean>;
  inApp: Record<"messages" | "connections" | "comments" | "support" | "projectsCommunities" | "missions", boolean>;
  browserEnabled: boolean;
  messagePreview: boolean;
};

const STORAGE_KEY = "belong:notification-preferences:v1";
export const PREFERENCES_EVENT = "belong:notification-preferences-changed";
export const defaultNotificationPreferences: NotificationPreferences = {
  soundEnabled: true,
  sounds: { messages: true, connections: true, social: true, missions: true },
  inApp: { messages: true, connections: true, comments: true, support: true, projectsCommunities: true, missions: true },
  browserEnabled: false,
  messagePreview: false,
};

let audioContext: AudioContext | null = null;
let userInteracted = false;
let cachedRaw: string | null | undefined;
let cachedPreferences = defaultNotificationPreferences;
if (typeof window !== "undefined") {
  const activate = () => {
    userInteracted = true;
    window.removeEventListener("pointerdown", activate);
    window.removeEventListener("keydown", activate);
  };
  window.addEventListener("pointerdown", activate, { once: true, passive: true });
  window.addEventListener("keydown", activate, { once: true });
}

export function getNotificationPreferences(): NotificationPreferences {
  if (typeof window === "undefined") return defaultNotificationPreferences;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedPreferences;
  try {
    const saved = JSON.parse(raw ?? "{}") as Partial<NotificationPreferences>;
    cachedRaw = raw;
    cachedPreferences = { ...defaultNotificationPreferences, ...saved, sounds: { ...defaultNotificationPreferences.sounds, ...saved.sounds }, inApp: { ...defaultNotificationPreferences.inApp, ...saved.inApp } };
    return cachedPreferences;
  } catch { cachedRaw = raw; cachedPreferences = defaultNotificationPreferences; return cachedPreferences; }
}
export function setNotificationPreferences(next: NotificationPreferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(PREFERENCES_EVENT));
}
export function updateNotificationPreferences(patch: Partial<NotificationPreferences>) {
  const current = getNotificationPreferences();
  setNotificationPreferences({ ...current, ...patch, sounds: { ...current.sounds, ...patch.sounds }, inApp: { ...current.inApp, ...patch.inApp } });
}
export function isSoundMuted() { return !getNotificationPreferences().soundEnabled; }
export function setSoundMuted(muted: boolean) { updateNotificationPreferences({ soundEnabled: !muted }); }
export function toggleSoundMuted() { const next = !isSoundMuted(); setSoundMuted(next); return next; }

type Step = { frequency: number; delay: number; duration: number; gain?: number; type?: OscillatorType };
const TONES: Record<SoundEvent, Step[]> = {
  "connection-request-sent": [{ frequency: 540, delay: 0, duration: .08 }, { frequency: 720, delay: .09, duration: .1 }],
  "connection-request-received": [{ frequency: 580, delay: 0, duration: .13, type: "triangle" }],
  "connection-accepted": [{ frequency: 520, delay: 0, duration: .09 }, { frequency: 690, delay: .08, duration: .1 }, { frequency: 860, delay: .16, duration: .12 }],
  "new-message": [{ frequency: 760, delay: 0, duration: .08 }],
  "new-comment": [{ frequency: 610, delay: 0, duration: .055, gain: .025 }],
  "new-support": [{ frequency: 680, delay: 0, duration: .06, gain: .025 }],
  "new-project-community": [{ frequency: 500, delay: 0, duration: .08 }, { frequency: 650, delay: .08, duration: .1 }],
  "mission-completed": [{ frequency: 520, delay: 0, duration: .08 }, { frequency: 690, delay: .08, duration: .09 }, { frequency: 880, delay: .17, duration: .14 }],
  "generic-success": [{ frequency: 620, delay: 0, duration: .08 }, { frequency: 780, delay: .08, duration: .1 }],
};
const EVENT_CATEGORY: Record<SoundEvent, SoundCategory> = {
  "connection-request-sent": "connections", "connection-request-received": "connections", "connection-accepted": "connections", "new-message": "messages", "new-comment": "social", "new-support": "social", "new-project-community": "social", "mission-completed": "missions", "generic-success": "social",
};
function context() {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  audioContext ??= new Ctor();
  return audioContext;
}
export function playSound(event: SoundEvent) {
  const preferences = getNotificationPreferences();
  if (!userInteracted || !preferences.soundEnabled || !preferences.sounds[EVENT_CATEGORY[event]]) return;
  const ctx = context();
  if (!ctx) return;
  for (const step of TONES[event]) {
    const oscillator = ctx.createOscillator(); const gain = ctx.createGain();
    const start = ctx.currentTime + step.delay; const end = start + step.duration;
    oscillator.type = step.type ?? "sine"; oscillator.frequency.value = step.frequency;
    gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(step.gain ?? .035, start + .012); gain.gain.exponentialRampToValueAtTime(.0001, end);
    oscillator.connect(gain).connect(ctx.destination); oscillator.start(start); oscillator.stop(end + .02);
  }
}
export function playTone(kind: "notification" | "connect" | "message") { playSound(kind === "connect" ? "connection-accepted" : kind === "message" ? "new-message" : "generic-success"); }
