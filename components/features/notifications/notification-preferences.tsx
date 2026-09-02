"use client";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@/systems/design-system";
import { defaultNotificationPreferences, getNotificationPreferences, PREFERENCES_EVENT, setNotificationPreferences, type NotificationPreferences } from "@/lib/sound";
import { useState, useSyncExternalStore } from "react";

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
  return <label className="flex cursor-pointer items-center justify-between gap-4 py-2 text-sm text-fg-secondary"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-brand" /></label>;
}

export function NotificationPreferencesPanel() {
  const preferences = useSyncExternalStore(
    (callback) => { window.addEventListener(PREFERENCES_EVENT, callback); window.addEventListener("storage", callback); return () => { window.removeEventListener(PREFERENCES_EVENT, callback); window.removeEventListener("storage", callback); }; },
    getNotificationPreferences,
    () => defaultNotificationPreferences
  );
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() => typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported");
  const save = (next: NotificationPreferences) => setNotificationPreferences(next);
  const setInApp = (key: keyof NotificationPreferences["inApp"], value: boolean) => save({ ...preferences, inApp: { ...preferences.inApp, [key]: value } });
  const setSound = (key: keyof NotificationPreferences["sounds"], value: boolean) => save({ ...preferences, sounds: { ...preferences.sounds, [key]: value } });
  const requestBrowserNotifications = async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission(); setPermission(result);
    save({ ...preferences, browserEnabled: result === "granted" });
  };
  const browserLabel = permission === "granted" ? "Browser notifications ON" : permission === "denied" ? "Notifications blocked in browser" : permission === "unsupported" ? "Browser notifications unavailable" : "Enable browser notifications";
  return <div className="space-y-6">
    <Card><CardHeader><CardTitle>In-app notifications</CardTitle></CardHeader><CardContent className="divide-y divide-border-subtle">
      <Toggle label="Messages" checked={preferences.inApp.messages} onChange={(v) => setInApp("messages", v)} />
      <Toggle label="Connections" checked={preferences.inApp.connections} onChange={(v) => setInApp("connections", v)} />
      <Toggle label="Comments" checked={preferences.inApp.comments} onChange={(v) => setInApp("comments", v)} />
      <Toggle label="Support" checked={preferences.inApp.support} onChange={(v) => setInApp("support", v)} />
      <Toggle label="Projects & communities" checked={preferences.inApp.projectsCommunities} onChange={(v) => setInApp("projectsCommunities", v)} />
      <Toggle label="Missions" checked={preferences.inApp.missions} onChange={(v) => setInApp("missions", v)} />
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Sounds</CardTitle></CardHeader><CardContent><Toggle label="Enable sounds" checked={preferences.soundEnabled} onChange={(v) => save({ ...preferences, soundEnabled: v })} /><div className="ml-4 divide-y divide-border-subtle border-l border-border-subtle pl-4"><Toggle label="Messages" checked={preferences.sounds.messages} onChange={(v) => setSound("messages", v)} /><Toggle label="Connections" checked={preferences.sounds.connections} onChange={(v) => setSound("connections", v)} /><Toggle label="Social activity" checked={preferences.sounds.social} onChange={(v) => setSound("social", v)} /><Toggle label="Missions" checked={preferences.sounds.missions} onChange={(v) => setSound("missions", v)} /></div><p className="mt-2 text-xs text-fg-muted">Sounds begin only after you interact with BELONG and remain off when muted.</p></CardContent></Card>
    <Card><CardHeader><CardTitle>Browser</CardTitle></CardHeader><CardContent className="space-y-3"><Button type="button" variant="secondary" onClick={requestBrowserNotifications} disabled={permission === "denied" || permission === "unsupported"}>{browserLabel}</Button><Toggle label="Show message previews" checked={preferences.messagePreview} onChange={(v) => save({ ...preferences, messagePreview: v })} /><p className="text-xs text-fg-muted">Message previews are off by default. Browser alerts are desktop-only until mobile push infrastructure is added.</p></CardContent></Card>
  </div>;
}
