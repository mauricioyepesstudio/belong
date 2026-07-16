import { Logo } from "@/systems/design-system";
import Link from "next/link";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-base">
      <header className="sticky top-0 z-50 border-b border-border-subtle bg-bg-base/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Logo href="/" />
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-fg-secondary transition-colors hover:text-fg-primary"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border-subtle py-12">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-fg-muted md:px-6">
          <p>© {new Date().getFullYear()} BELONG. Build a life that matters.</p>
        </div>
      </footer>
    </div>
  );
}
