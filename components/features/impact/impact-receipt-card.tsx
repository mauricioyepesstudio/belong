import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ImpactReceipt } from "@/types/impact-receipt";
import { formatDistanceToNow } from "@/lib/format";
import { Share2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function ImpactReceiptCard({ receipt }: { receipt: ImpactReceipt }) {
  const { toast } = useToast();

  const handleShare = () => {
    const url = `${window.location.origin}/${receipt.subjectType.toLowerCase()}s/${receipt.subjectId}`;
    navigator.clipboard.writeText(url);
    toast("Link copied to clipboard", "success");
  };

  return (
    <Card className="w-full max-w-sm border-brand/20 bg-bg-base/80">
      <CardContent className="space-y-4 p-6">
        <div>
          <Badge variant="brand" className="mb-2">Impact Receipt</Badge>
          <h3 className="text-lg font-semibold text-fg-primary">{receipt.title}</h3>
          <p className="mt-1 text-sm text-fg-muted">{receipt.summary}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {receipt.metrics.map((m, i) => (
            <div key={i} className="rounded-lg bg-bg-hover p-3">
              <p className="text-xs text-fg-muted">{m.label}</p>
              <p className="text-xl font-semibold text-fg-primary">{m.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-fg-muted">
          <span>{receipt.provenance}</span>
          <span>{formatDistanceToNow(receipt.completedAt)} ago</span>
        </div>

        <Button className="w-full" variant="secondary" onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" />
          Share receipt
        </Button>
      </CardContent>
    </Card>
  );
}
