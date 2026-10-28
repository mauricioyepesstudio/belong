import { siteConfig } from "@/config/site";
import { HUMAN_NEEDS } from "@/engines/belong/purpose";
import { PLATFORM_TIERS } from "@/engines/billing/config";
import { Card, CardContent } from "@/systems/design-system";
import {
  Award,
  CalendarDays,
  Check,
  Compass,
  FolderKanban,
  HeartHandshake,
  ShoppingBag,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${siteConfig.name} · ${siteConfig.tagline}`,
  description: siteConfig.description,
  openGraph: {
    title: `${siteConfig.name} · ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [{ url: "/social/belong-post-01-your-world.jpg", width: 1080, height: 1350 }],
  },
};

const ctaBrand =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-[15px] font-medium text-white shadow-[0_0_24px_var(--brand-glow)] transition-colors hover:bg-brand/90";
const ctaSecondary =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-bg-surface px-6 text-[15px] font-medium text-fg-primary transition-colors hover:border-border-strong hover:bg-bg-hover";

const steps = [
  {
    icon: Compass,
    title: "Share your purpose",
    description: "Tell BELONG what you care about and what you want to build. Your home adapts to it.",
  },
  {
    icon: Users,
    title: "Find your people",
    description: "Join communities and accountability circles with people who push in the same direction.",
  },
  {
    icon: Target,
    title: "Build and measure",
    description: "Turn ideas into projects with goals and tasks, and see the impact you create add up.",
  },
];

const features = [
  {
    icon: HeartHandshake,
    title: "Communities",
    description: "Spaces around a shared mission, with conversations, members and events in one place.",
  },
  {
    icon: FolderKanban,
    title: "Projects that move",
    description: "Goals, tasks and owners. Progress only counts once the work is actually saved.",
  },
  {
    icon: Users,
    title: "Accountability Circles",
    description: "Small groups with regular check-ins so nobody builds alone.",
  },
  {
    icon: Award,
    title: "Impact Passport",
    description: "Your Belong Score, streaks and contributions, collected in one honest record.",
  },
  {
    icon: CalendarDays,
    title: "Events",
    description: "Meetups and sessions that turn online connections into real collaboration.",
  },
  {
    icon: ShoppingBag,
    title: "Marketplace",
    description: "Offer your skills and find what your project needs from people you trust.",
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden px-4 pb-20 pt-20 md:px-6 md:pb-28 md:pt-28">
        <Image
          src="/images/home-world.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover opacity-45"
        />
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-bg-base/40 via-bg-base/70 to-bg-base"
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-label text-brand">{siteConfig.tagline}</p>
          <h1 className="mt-4 text-display text-fg-primary md:text-5xl lg:text-6xl">
            Build your future.
            <br />
            Help build the future of others.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-fg-secondary">
            BELONG is where people with purpose meet, build projects together and track the real
            impact they create. Less scrolling. More building.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className={ctaBrand}>
              Join BELONG free
            </Link>
            <Link href="#how-it-works" className={ctaSecondary}>
              See how it works
            </Link>
          </div>
          <p className="mt-4 text-sm text-fg-muted">Free plan. No credit card needed.</p>
        </div>
      </section>

      <section id="why" className="border-t border-border-subtle px-4 py-20 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-label text-brand">Why BELONG exists</p>
            <h2 className="mt-3 text-2xl font-semibold text-fg-primary md:text-3xl">
              People need each other to grow
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-fg-muted">
              Connection, growth and contribution are universal needs. BELONG is built around all
              three.
            </p>
          </div>
          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {HUMAN_NEEDS.map((need) => (
              <li key={need.id}>
                <Card className="h-full border-border-subtle bg-bg-elevated">
                  <CardContent className="pt-6">
                    <p className="text-3xl font-semibold text-brand">{need.stat}</p>
                    <p className="mt-2 text-fg-primary">{need.statement}</p>
                    <p className="mt-4 text-sm text-fg-muted">{need.answer}</p>
                    <a
                      href={need.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block text-xs text-fg-muted underline underline-offset-2 hover:text-fg-secondary"
                    >
                      Source: {need.source.name}, {need.source.year}
                    </a>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-border-subtle px-4 py-20 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-label text-brand">How it works</p>
            <h2 className="mt-3 text-2xl font-semibold text-fg-primary md:text-3xl">
              From idea to impact in three steps
            </h2>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title}>
                <Card className="h-full border-border-subtle bg-bg-elevated">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-sm font-semibold text-brand">
                        {index + 1}
                      </span>
                      <step.icon className="h-5 w-5 text-brand" aria-hidden />
                    </div>
                    <h3 className="mt-4 font-semibold text-fg-primary">{step.title}</h3>
                    <p className="mt-2 text-sm text-fg-muted">{step.description}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="features"
        className="border-t border-border-subtle bg-bg-elevated/50 px-4 py-20 md:px-6"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-label text-brand">Inside BELONG</p>
            <h2 className="mt-3 text-2xl font-semibold text-fg-primary md:text-3xl">
              Everything you need to build with others
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-fg-muted">
              Built to create value, not to keep you scrolling.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border-subtle bg-bg-elevated">
                <CardContent className="pt-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
                    <feature.icon className="h-5 w-5 text-brand" aria-hidden />
                  </div>
                  <h3 className="mt-4 font-semibold text-fg-primary">{feature.title}</h3>
                  <p className="mt-2 text-sm text-fg-muted">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-border-subtle px-4 py-20 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-label text-brand">Pricing</p>
            <h2 className="mt-3 text-2xl font-semibold text-fg-primary md:text-3xl">
              Start free. Upgrade when you are ready.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PLATFORM_TIERS.map((tier) => (
              <Card
                key={tier.id}
                className={
                  tier.highlighted
                    ? "border-brand/40 bg-bg-elevated shadow-[0_0_32px_var(--brand-glow)]"
                    : "border-border-subtle bg-bg-elevated"
                }
              >
                <CardContent className="flex h-full flex-col pt-6">
                  <h3 className="font-semibold text-fg-primary">{tier.name}</h3>
                  <p className="mt-2">
                    <span className="text-3xl font-semibold text-fg-primary">{tier.price}</span>
                    {tier.priceCents > 0 && <span className="text-sm text-fg-muted"> / month</span>}
                  </p>
                  <p className="mt-2 text-sm text-fg-muted">{tier.description}</p>
                  <ul className="mt-6 flex-1 space-y-2">
                    {tier.features.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-fg-secondary">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`mt-8 w-full ${tier.highlighted ? ctaBrand : ctaSecondary}`}
                  >
                    {tier.priceCents > 0 ? `Start with ${tier.name}` : "Join free"}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 md:px-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-brand/20 bg-gradient-to-br from-brand/10 to-transparent p-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-brand" aria-hidden />
          <h2 className="mt-4 text-2xl font-semibold text-fg-primary">
            Your people are already building
          </h2>
          <p className="mt-3 text-fg-secondary">
            Create your profile, pick a community and start your first project today.
          </p>
          <Link href="/register" className={`mt-8 ${ctaBrand}`}>
            Join BELONG free
          </Link>
        </div>
      </section>
    </>
  );
}
