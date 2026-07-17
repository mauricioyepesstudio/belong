import { Card, CardContent } from "@/systems/design-system";

export function OrganizationListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="h-32 animate-pulse bg-white/[0.03]" />
        </Card>
      ))}
    </div>
  );
}

export function OrganizationDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="h-40 animate-pulse bg-white/[0.03]" />
      </Card>
      <Card>
        <CardContent className="h-64 animate-pulse bg-white/[0.03]" />
      </Card>
    </div>
  );
}
