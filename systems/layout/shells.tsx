import type { ReactNode } from "react";
import { Logo } from "@/components/ui";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-bg-base">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.12)_0%,transparent_50%)]"
        aria-hidden
      />
      {children}
    </div>
  );
}

export function OnboardingShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-base">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-brand/8 blur-[100px]" />
      </div>
      <header className="relative z-10 flex h-16 items-center justify-center border-b border-border-subtle bg-bg-base/80 backdrop-blur-xl">
        <Logo href="/login" size="sm" />
      </header>
      <main className="relative z-10">{children}</main>
    </div>
  );
}
