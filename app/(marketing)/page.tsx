import { siteConfig } from "@/config/site";
import { Button, Card, CardContent } from "@/systems/design-system";
import { Calendar, FolderKanban, ShoppingBag, Sparkles, Users, Zap } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

const pillars = [
  {
    icon: Users,
    title: "Communities",
    description: "Find your people. Join purpose-driven groups or build paid memberships.",
  },
  {
    icon: FolderKanban,
    title: "Projects",
    description: "Ship what matters. Track progress, collaborate, and raise funding.",
  },
  {
    icon: Calendar,
    title: "Events",
    description: "Gather builders. Host workshops, meetups, and moments that move you forward.",
  },
  {
    icon: ShoppingBag,
    title: "Marketplace",
    description: "Monetize your craft. Sell templates, resources, and digital goods.",
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden px-4 py-24 md:px-6 md:py-32">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand/10 via-transparent to-transparent"
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-label text-brand">{siteConfig.tagline}</p>
          <h1 className="mt-4 text-display text-fg-primary md:text-5xl lg:text-6xl">
            The platform for builders who want their work to matter
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-fg-secondary">
            {siteConfig.description} Communities, projects, events, messaging, and a creator
            economy — unified in one beautiful workspace.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg" variant="brand">
                Start building free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border-subtle bg-bg-elevated/50 px-4 py-20 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-fg-primary md:text-3xl">
              Everything connected. Nothing fragmented.
            </h2>
            <p className="mt-3 text-fg-muted">
              One design system. One layout. Real data from day one.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar) => (
              <Card key={pillar.title} className="border-border-subtle bg-bg-elevated">
                <CardContent className="pt-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
                    <pillar.icon className="h-5 w-5 text-brand" aria-hidden />
                  </div>
                  <h3 className="mt-4 font-semibold text-fg-primary">{pillar.title}</h3>
                  <p className="mt-2 text-sm text-fg-muted">{pillar.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 md:px-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-brand/20 bg-gradient-to-br from-brand/10 to-transparent p-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-brand" aria-hidden />
          <h2 className="mt-4 text-2xl font-semibold text-fg-primary">AI Coach built in</h2>
          <p className="mt-3 text-fg-secondary">
            Personalized next steps based on your connections, projects, and community activity —
            so you always know what to do next.
          </p>
          <Link href="/register" className="mt-8 inline-block">
            <Button variant="brand">
              <Zap className="h-4 w-4" aria-hidden />
              Open your dashboard
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
