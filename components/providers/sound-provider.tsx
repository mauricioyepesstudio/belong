"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type SoundEvent =
  | "connection-sent"
  | "connection-accepted"
  | "message"
  | "notification"
  | "support"
  | "success";

type SoundContextValue = {
  muted: boolean;
  enabled: boolean;
  toggleMuted: () => void;
  play: (event: SoundEvent) => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);
const STORAGE_KEY = "belong-sound-muted";

const patterns: Record<SoundEvent, Array<[number, number, number]>> = {
  "connection-sent": [[440, 0, 0.08], [660, 0.09, 0.1]],
  "connection-accepted": [[392, 0, 0.08], [494, 0.08, 0.08], [659, 0.16, 0.13]],
  message: [[620, 0, 0.1]],
  notification: [[520, 0, 0.07], [700, 0.08, 0.09]],
  support: [[480, 0, 0.06], [580, 0.06, 0.07]],
  success: [[523, 0, 0.07], [784, 0.08, 0.1]],
};

export function SoundProvider({ children }: { children: ReactNode }) {
  const contextRef = useRef<AudioContext | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    queueMicrotask(() => setMuted(window.localStorage.getItem(STORAGE_KEY) === "true"));
    const enable = () => {
      const AudioContextClass = window.AudioContext;
      if (!contextRef.current) contextRef.current = new AudioContextClass();
      void contextRef.current.resume();
      setEnabled(true);
    };
    window.addEventListener("pointerdown", enable, { once: true });
    window.addEventListener("keydown", enable, { once: true });
    return () => {
      window.removeEventListener("pointerdown", enable);
      window.removeEventListener("keydown", enable);
      void contextRef.current?.close();
    };
  }, []);

  const toggleMuted = useCallback(() => {
    setMuted((value) => {
      const next = !value;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const play = useCallback((event: SoundEvent) => {
    const context = contextRef.current;
    if (!context || !enabled || muted) return;
    const start = context.currentTime;
    for (const [frequency, delay, duration] of patterns[event]) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start + delay);
      gain.gain.setValueAtTime(0.0001, start + delay);
      gain.gain.exponentialRampToValueAtTime(0.055, start + delay + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + delay + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start + delay);
      oscillator.stop(start + delay + duration + 0.02);
    }
  }, [enabled, muted]);

  return (
    <SoundContext.Provider value={{ muted, enabled, toggleMuted, play }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) throw new Error("useSound must be used within SoundProvider");
  return context;
}
