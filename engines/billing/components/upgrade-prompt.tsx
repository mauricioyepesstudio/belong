import type { UserProfile } from "@/types/database.types";
import { Button, Card, CardContent } from "@/systems/design-system";
import { Sparkles } from "lucide-react";
import Link from "next/link";

type UpgradePromptProps = {
  tier: UserProfile["subscription_tier"];
};

/**
 * Pro/Creator checkout already works end-to-end (lib/actions/billing.ts) but
 * the only way to reach it was visiting /pricing directly — free users had
 * no in-app path to discover it. This is that discovery path.
 */
export function UpgradePrompt({ tier }: UpgradePromptProps) {
  if (tier === "pro" || tier === "creator") return null;

  return (
    <Card className="border-brand/20 bg-brand/[0.04]">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 shrink-0 text-brand" aria-hidden />
          <div>
            <p className="text-body font-medium text-fg-primary">You&apos;re on the Free plan</p>
            <p className="text-caption text-fg-faint">
              Unlock priority AI insights, paid communities, and project funding with Pro or Creator.
            </p>
          </div>
        </div>
        <Link href="/pricing">
          <Button variant="brand" className="rounded-2xl">
            See plans
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
