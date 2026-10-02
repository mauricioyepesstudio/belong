"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { postCircleCheckin } from "@/lib/actions/circles";
import { Button, Textarea, useToast } from "@/systems/design-system";

type CheckinComposerProps = {
  circleId: string;
};

export function CheckinComposer({ circleId }: CheckinComposerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) {
      toast("Check-in cannot be empty", "error");
      return;
    }

    startTransition(async () => {
      const result = await postCircleCheckin(circleId, trimmed);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      setBody("");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Share a check-in with your circle..."
        rows={3}
        disabled={isPending}
        aria-label="Write a check-in"
      />
      <div className="flex justify-end">
        <Button type="submit" variant="brand" size="sm" isLoading={isPending} disabled={isPending}>
          <Send className="h-4 w-4" aria-hidden />
          Post check-in
        </Button>
      </div>
    </form>
  );
}
