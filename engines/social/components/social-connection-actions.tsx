"use client";

import {
  respondToConnection,
  sendConnectionRequest,
  startConversation,
} from "@/lib/actions/connections";
import { Button, useToast } from "@/systems/design-system";
import { Check, Clock3, MessageSquare, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { playSound } from "@/lib/sound";

export type SocialConnectionState =
  | "self"
  | "none"
  | "pending_sent"
  | "pending_received"
  | "connected";

export function SocialConnectionActions({
  userId,
  name,
  initialState,
  connectionId,
}: {
  userId: string;
  name: string;
  initialState: SocialConnectionState;
  connectionId: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, setState] = useState(initialState);
  const [pending, startTransition] = useTransition();

  const connect = () => {
    startTransition(async () => {
      const result = await sendConnectionRequest(userId);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      setState("pending_sent");
      playSound("connection-request-sent");
      toast(`Connection request sent to ${name}`, "success");
      router.refresh();
    });
  };

  const message = () => {
    startTransition(async () => {
      const result = await startConversation(userId);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      router.push(`/messages?conversation=${result.id}`);
    });
  };

  const respond = (accept: boolean) => {
    if (!connectionId) {
      toast("Connection request could not be found", "error");
      return;
    }
    startTransition(async () => {
      const result = await respondToConnection(connectionId, accept);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      setState(accept ? "connected" : "none");
      if (accept) playSound("connection-accepted");
      toast(
        accept ? `You and ${name} are now connected` : "Connection request declined",
        "success"
      );
      router.refresh();
    });
  };

  if (state === "self") return null;

  if (state === "connected") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" disabled>
          <Check className="h-4 w-4" aria-hidden />
          Connected
        </Button>
        <Button variant="brand" disabled={pending} onClick={message}>
          <MessageSquare className="h-4 w-4" aria-hidden />
          Message
        </Button>
      </div>
    );
  }

  if (state === "pending_received") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          variant="brand"
          disabled={pending}
          isLoading={pending}
          onClick={() => respond(true)}
        >
          <Check className="h-4 w-4" aria-hidden />
          Accept
        </Button>
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => respond(false)}
        >
          Decline
        </Button>
      </div>
    );
  }

  if (state === "pending_sent") {
    return (
      <Button variant="secondary" disabled>
        <Clock3 className="h-4 w-4" aria-hidden />
        Request sent
      </Button>
    );
  }

  return (
    <Button variant="brand" disabled={pending} isLoading={pending} onClick={connect}>
      <UserPlus className="h-4 w-4" aria-hidden />
      Connect
    </Button>
  );
}
