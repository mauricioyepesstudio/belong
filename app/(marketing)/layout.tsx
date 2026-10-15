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
              href="/#how-it-works"
              className="hidden rounded-xl px-4 py-2 text-sm font-medium text-fg-secondary transition-colors hover:text-fg-primary sm:inline-flex"
            >
              How it works
            </Link>
            <Link
              href="/#pricing"
              className="hidden rounded-xl px-4 py-2 text-sm font-medium text-fg-secondary transition-colors hover:text-fg-primary sm:inline-flex"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-fg-secondary transition-colors hover:text-fg-primary"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Join BELONG
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border-subtle py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-sm text-fg-muted md:flex-row md:justify-between md:px-6">
          <p>© {new Date().getFullYear()} BELONG. Build a life that matters.</p>
          <nav className="flex gap-4">
            <Link href="/#features" className="hover:text-fg-primary">
              Features
            </Link>
            <Link href="/#pricing" className="hover:text-fg-primary">
              Pricing
            </Link>
            <Link href="/login" className="hover:text-fg-primary">
              Sign In
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
