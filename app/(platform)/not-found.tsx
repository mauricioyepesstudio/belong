import Link from "next/link";
import { Button } from "@/systems/design-system";

export default function PlatformNotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-label">Not found</p>
      <h1 className="text-heading-lg mt-2 text-fg-primary">This page doesn&apos;t exist</h1>
      <p className="mt-3 text-body text-fg-secondary">
        The link may be outdated or the item was removed.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/dashboard">
          <Button>Go to Home</Button>
        </Link>
        <Link href="/community">
          <Button variant="secondary">Browse communities</Button>
        </Link>
      </div>
    </div>
  );
}
